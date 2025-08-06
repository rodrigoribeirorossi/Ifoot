const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { seedTeams, associateTeamsToCompetitions } = require('./seed-data');
const { generateUserTeamMatches} = require('./simplified-calendar');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/assets', express.static('public/assets'));

// Configure sua conexão MySQL
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root', // ou outro usuário criado
  password: 'AQWzsx2éàé(1', // senha definida na instalação
  database: 'ifoot_simple',
  port: 3306,
});

// Modificar a API para filtrar apenas jogadores aposentados
app.get('/api/jogadores', async (req, res) => {
  const { position, exclude } = req.query;
  let excludeIds = [];
  
  if (exclude && exclude.length > 0) {
    excludeIds = exclude.split(',').map(id => parseInt(id, 10));
  }
  
  try {
    let query;
    let params = [];
    
    // MODIFICAÇÃO AQUI: Substituir 'SELECT *' por uma lista explícita de colunas incluindo 'value_euro as value'
    const selectColumns = 'SELECT id, name, position, age, nationality, overall, club, photo_url, height, weight, preferred_foot, value_euro as value';
    
    if (position === 'Qualquer') {
      if (excludeIds.length > 0) {
        query = `${selectColumns} FROM jogadores WHERE status = "retired" AND id NOT IN (?) ORDER BY RAND() LIMIT 3`;
        params = [excludeIds];
      } else {
        query = `${selectColumns} FROM jogadores WHERE status = "retired" ORDER BY RAND() LIMIT 3`;
      }
    } else {
      if (excludeIds.length > 0) {
        query = `${selectColumns} FROM jogadores WHERE status = "retired" AND position = ? AND id NOT IN (?) ORDER BY RAND() LIMIT 3`;
        params = [position, excludeIds];
      } else {
        query = `${selectColumns} FROM jogadores WHERE status = "retired" AND position = ? ORDER BY RAND() LIMIT 3`;
        params = [position];
      }
    }
    
    // Formatar a consulta SQL
    query = query.replace('NOT IN (?)', excludeIds.length > 0 
      ? `NOT IN (${excludeIds.map(() => '?').join(',')})`
      : '');
    
    // Ajustar os parâmetros
    if (excludeIds.length > 0) {
      params = position === 'Qualquer' 
        ? excludeIds
        : [position, ...excludeIds];
    }
    
    // Adicione este log após a consulta SQL no endpoint /api/jogadores para diagnosticar o problema:
    const [rows] = await pool.query(query, params);
    // Debug para confirmar que os valores estão vindo corretamente
    console.log("Jogadores da posição", position, "- valores:", rows.map(p => p.value));
    
    // Log para verificar o formato dos dados retornados
    if (rows.length > 0) {
      console.log("Dados do primeiro jogador:", {
        id: rows[0].id,
        name: rows[0].name,
        valor_original: rows[0].value_euro,
        valor_mapeado: rows[0].value
      });
    }

    // Assegurar que cada jogador tenha um valor definido
    const processedRows = rows.map(player => {
      if (player.value === undefined && player.value_euro !== undefined) {
        player.value = player.value_euro;
      }
      return player;
    });
    
    res.json(processedRows);
  } catch (err) {
    console.error('Erro na consulta:', err);
    res.status(500).json({ error: 'Erro ao buscar jogadores' });
  }
});

// Adicionar jogador
app.post('/api/jogadores', async (req, res) => {
  const { name, position, age, nationality, overall, club, photo_url, height, weight, foot } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO jogadores (name, position, age, nationality, overall, club, photo_url, height, weight, foot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, position, age, nationality, overall, club, photo_url, height, weight, foot]
    );
    const [newPlayer] = await pool.query('SELECT * FROM jogadores WHERE id = ?', [result.insertId]);
    res.json(newPlayer[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar jogador' });
  }
});

// Modificar o endpoint /api/save-team para limpar dados antigos e usar o nome do time recebido:
app.post('/api/save-team', async (req, res) => {
  const { 
    teamName, 
    stadiumName, 
    color1, 
    color2, 
    userId, 
    formation, 
    players, 
    budgetRemaining, 
    teamValue 
  } = req.body;
  
  console.log("Salvando time:", {
    teamName,
    stadiumName,
    color1,
    color2,
    players: players.length,
    budgetRemaining
  });
  
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Verificar se o usuário existe, caso contrário criar
      const [userExists] = await connection.query(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      
      if (userExists.length === 0) {
        await connection.query(
          'INSERT INTO users (id, username, email) VALUES (?, ?, ?)',
          [userId, `user${userId}`, `user${userId}@example.com`]
        );
      }
      
      // 1. Verificar se o time já existe para este usuário
      const [existingTeam] = await connection.query(
        'SELECT id FROM user_teams WHERE user_id = ?',
        [userId]
      );
      
      let teamId;
      
      // IMPORTANTE: Limpar TODOS os dados do time anterior se existir
      if (existingTeam.length > 0) {
        teamId = existingTeam[0].id;
        
        // Limpar todos os dados relacionados ao time anterior
        await cleanupExistingData(connection, teamId);
        
        // Atualizar o time existente com os novos dados
        await connection.query(
          `UPDATE user_teams 
           SET name = ?, stadium_name = ?, color1 = ?, color2 = ?, formation = ?, budget_remaining = ?
           WHERE id = ?`,
          [teamName, stadiumName, color1, color2, formation, budgetRemaining, teamId]
        );
        
        // Remover jogadores antigos
        await connection.query(
          'DELETE FROM user_team_players WHERE team_id = ?',
          [teamId]
        );
      } else {
        // Criar um novo time
        const [result] = await connection.query(
          `INSERT INTO user_teams 
           (user_id, name, stadium_name, color1, color2, formation, budget_remaining) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, teamName, stadiumName, color1, color2, formation, budgetRemaining]
        );
        
        teamId = result.insertId;
      }
      
      // 2. Inserir os jogadores do time
      if (players.length > 0) {
        const playerValues = players.map((playerId, index) => [
          teamId,
          playerId,
          index < 11 ? 1 : 0, // Os primeiros 11 são titulares
          index === 0 ? 1 : 0, // O primeiro jogador é o capitão
          0, 0, 0, // penalty_taker, freekick_taker, corner_taker
          index + 1, // Posição (1-based)
          1 // Ativo (true)
        ]);
        
        await connection.query(
          `INSERT INTO user_team_players 
           (team_id, player_id, is_starter, is_captain, is_penalty_taker, 
            is_freekick_taker, is_corner_taker, position, active) 
           VALUES ?`,
          [playerValues]
        );
      }
      
      // CRUCIAL: Sincronizar time entre tabelas
      await syncUserTeam(connection, teamId, teamName);
      
      await connection.commit();
      res.json({ success: true, teamId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Erro ao salvar time:', err);
    res.status(500).json({ error: 'Erro ao salvar o time' });
  }
});

// Endpoint para buscar técnicos
app.get('/api/tecnicos', async (req, res) => {
  try {
    // Busca os técnicos, podendo filtrar pelo orçamento disponível
    const { budget } = req.query;
    let query = 'SELECT * FROM tecnicos WHERE status = "retired"';
    
    // Se um orçamento foi especificado, filtrar técnicos que cabem no orçamento
    if (budget !== undefined) {
      const maxValue = parseInt(budget);
      query += ` AND value <= ${maxValue}`;
    }
    
    query += ' ORDER BY overall DESC LIMIT 6'; // Limita a 6 opções
    
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Erro na consulta de técnicos:', err);
    res.status(500).json({ error: 'Erro ao buscar técnicos' });
  }
});

// Endpoint para salvar o técnico escolhido
app.post('/api/save-coach', async (req, res) => {
  const { teamId, coachId } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar se o técnico é o técnico gratuito especial (ID 999999)
      const isFreeCoach = coachId === 999999;
      
      if (isFreeCoach) {
        // Verificar se o técnico gratuito já existe no banco de dados
        const [existingCoach] = await connection.query(
          'SELECT id FROM tecnicos WHERE id = ?', 
          [coachId]
        );
        
        // Se não existe, criar o técnico gratuito no banco de dados
        if (existingCoach.length === 0) {
          await connection.query(`
            INSERT INTO tecnicos (id, name, nationality, age, overall, photo_url, value, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              999999, 
              "Assistente Técnico", 
              "Brasil", 
              45, 
              60, 
              "https://cdn-icons-png.flaticon.com/512/3003/3003035.png", 
              0, 
              "retired"
            ]
          );
        }
      }
      
      // Atualizar o time com o ID do técnico escolhido
      await connection.query(
        'UPDATE user_teams SET coach_id = ? WHERE id = ?',
        [coachId, teamId]
      );
      
      // Se não for o técnico gratuito, obter o valor e atualizar o orçamento
      if (!isFreeCoach) {
        const [coaches] = await connection.query(
          'SELECT value FROM tecnicos WHERE id = ?', 
          [coachId]
        );
        
        if (coaches.length > 0) {
          const coachValue = coaches[0].value;
          
          // Atualizar o orçamento restante do time
          await connection.query(
            'UPDATE user_teams SET budget_remaining = budget_remaining - ? WHERE id = ?',
            [coachValue, teamId]
          );
        }
      }
      
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Erro ao salvar técnico:', err);
    res.status(500).json({ error: 'Erro ao salvar o técnico', message: err.message });
  }
});

// Obter informações de um time específico
app.get('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [teams] = await pool.query(
      'SELECT * FROM user_teams WHERE id = ?',
      [id]
    );
    
    if (teams.length === 0) {
      return res.status(404).json({ message: 'Time não encontrado' });
    }
    
    res.json(teams[0]);
  } catch (error) {
    console.error('Erro ao buscar time:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Obter jogadores de um time específico
app.get('/api/team-players/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    console.log(`Buscando jogadores para o time ID: ${teamId}`);
    
    // Verificar dados na tabela
    const [checkPlayers] = await pool.query(
      'SELECT COUNT(*) as player_count FROM user_team_players WHERE team_id = ? AND active = TRUE',
      [teamId]
    );
    console.log(`Encontrados ${checkPlayers[0].player_count} jogadores Ativos na tabela user_team_players`);

    // Buscar jogadores do time usando as tabelas corretas
    const [players] = await pool.query(
      `SELECT j.id, j.name, j.position, j.age, j.nationality, j.overall, j.club, j.photo_url, 
              utp.is_starter as isStarter, utp.is_captain as isCaptain, 
              utp.position as position_number,
              utp.is_penalty_taker as isPenaltyTaker, utp.is_freekick_taker as isFreekickTaker,
              utp.is_corner_taker as isCornerTaker,
              100 as energy, false as isInjured, false as isSuspended
       FROM user_team_players utp
       JOIN jogadores j ON utp.player_id = j.id
       WHERE utp.team_id = ? AND utp.active = TRUE
       ORDER BY utp.is_starter DESC, utp.position ASC, j.overall DESC`,
      [teamId]
    );
        
    if (players.length > 0) {
      console.log(`Retornando ${players.length} jogadores ativos.`);
    } else {
      console.log('Nenhum jogador ativo encontrado para este time.');
    }
    
    // Log para verificar se os dados estão vindo corretamente
    if (players.length > 0) {
      console.log(`Retornando ${players.length} jogadores.`);
      console.log(`Exemplo do primeiro jogador:`, {
        id: players[0].id,
        name: players[0].name,
        position: players[0].position,
        overall: players[0].overall,
        isStarter: players[0].isStarter
      });
    } else {
      console.log('Nenhum jogador encontrado para este time.');
    }

    res.json(players);
  } catch (error) {
    console.error('Erro ao buscar jogadores do time:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
});

// Adicione este novo endpoint ao seu server.js
app.put('/api/team-players/:teamId/update-roles', async (req, res) => {
  const { teamId } = req.params;
  const { captain, penaltyTaker, freekickTaker, cornerTaker } = req.body;
  
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Primeiro, resetamos todos os papéis para este time
      await connection.query(
        `UPDATE user_team_players 
         SET is_captain = false, is_penalty_taker = false, 
             is_freekick_taker = false, is_corner_taker = false
         WHERE team_id = ?`,
        [teamId]
      );
      
      // Definir o capitão
      if (captain) {
        await connection.query(
          `UPDATE user_team_players 
           SET is_captain = true
           WHERE team_id = ? AND player_id = ?`,
          [teamId, captain]
        );
      }
      
      // Definir o cobrador de pênaltis
      if (penaltyTaker) {
        await connection.query(
          `UPDATE user_team_players 
           SET is_penalty_taker = true
           WHERE team_id = ? AND player_id = ?`,
          [teamId, penaltyTaker]
        );
      }
      
      // Definir o cobrador de faltas
      if (freekickTaker) {
        await connection.query(
          `UPDATE user_team_players 
           SET is_freekick_taker = true
           WHERE team_id = ? AND player_id = ?`,
          [teamId, freekickTaker]
        );
      }
      
      // Definir o cobrador de escanteios
      if (cornerTaker) {
        await connection.query(
          `UPDATE user_team_players 
           SET is_corner_taker = true
           WHERE team_id = ? AND player_id = ?`,
          [teamId, cornerTaker]
        );
      }
      
      await connection.commit();
      res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar papéis dos jogadores:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Adicione este novo endpoint para buscar jogadores aleatórios com overall < 80
app.get('/api/random-players-below-80', async (req, res) => {
  try {
    const { count } = req.query;
    const playerCount = parseInt(count) || 23;
    
    // Corrigir nome da coluna: 'foot' -> 'preferred_foot'
    const [rows] = await pool.query(
      'SELECT id, name, position, age, nationality, overall, club, photo_url, height, weight, preferred_foot, value_euro as value FROM jogadores WHERE overall < 80 AND status = "retired" ORDER BY RAND() LIMIT ?',
      [playerCount]
    );
    
    // Log para verificar se os valores estão sendo retornados
    console.log("Valores dos primeiros 3 jogadores:", rows.slice(0, 3).map(p => p.value));
    
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar jogadores aleatórios:', err);
    res.status(500).json({ error: 'Erro ao buscar jogadores' });
  }
});

// Obter lista de temporadas
app.get('/api/seasons', async (req, res) => {
  try {
    const [seasons] = await pool.query('SELECT * FROM seasons ORDER BY year');
    res.json(seasons);
  } catch (err) {
    console.error('Erro ao buscar temporadas:', err);
    res.status(500).json({ error: 'Erro ao buscar temporadas' });
  }
});

// Iniciar uma nova temporada
app.post('/api/seasons/start', async (req, res) => {
  try {
    const { year, user_team_id } = req.body;
    
    if (!user_team_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID do time é obrigatório' 
      });
    }
    
    // Buscar dados do time para confirmar que existe
    const [teamData] = await pool.query(
      'SELECT name FROM user_teams WHERE id = ?',
      [user_team_id]
    );
    
    if (teamData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Time não encontrado'
      });
    }
    
    const teamName = teamData[0].name;
    console.log(`Iniciando temporada para o time: ${teamName} (ID: ${user_team_id})`);
    
    const connection = await pool.getConnection();
    
    try {
      // Inicializar a temporada para o time com um início limpo
      const seasonId = await initializeFirstSeason(connection, undefined, user_team_id);
      
      res.json({ 
        success: true, 
        message: 'Temporada iniciada com sucesso', 
        seasonId 
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao iniciar temporada:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao iniciar temporada' 
    });
  }
});

// Obter calendário de jogos
app.get('/api/calendar/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { season_id } = req.query;
  
  try {
    console.log(`Buscando jogos do calendário para time ${teamId}, temporada ${season_id}`);
    
    // VERIFICAÇÃO MELHORADA: Mostrar partidas em outras temporadas também
    const [allTeamMatches] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN season_id = ? THEN 1 ELSE 0 END) as with_season_id,
        SUM(CASE WHEN season_id IS NULL THEN 1 ELSE 0 END) as without_season_id,
        SUM(CASE WHEN season_id IS NOT NULL AND season_id != ? THEN 1 ELSE 0 END) as other_season
      FROM matches 
      WHERE (home_team_id = ? OR away_team_id = ?)`,
      [season_id, season_id, teamId, teamId]
    );
    
    console.log(`Diagnóstico detalhado:`, 
      `Total: ${allTeamMatches[0].total}, ` +
      `Com season_id=${season_id}: ${allTeamMatches[0].with_season_id}, ` + 
      `Sem season_id: ${allTeamMatches[0].without_season_id}, ` +
      `Com outras temporadas: ${allTeamMatches[0].other_season}`);
    
    // SOLUÇÃO: Se existem partidas mas nenhuma na temporada atual, atualizar todas
    if (allTeamMatches[0].with_season_id === 0 && allTeamMatches[0].total > 0) {
      console.log(`Atualizando partidas para temporada atual ${season_id}...`);
      
      await pool.query(
        'UPDATE matches SET season_id = ? WHERE (home_team_id = ? OR away_team_id = ?)',
        [season_id, teamId, teamId]
      );
      
      console.log(`${allTeamMatches[0].total} partidas atualizadas para temporada ${season_id}`);
    }
    // Se não existirem partidas, gerar novas
    else if (allTeamMatches[0].total === 0) {
      console.log(`Não há partidas para este time. Gerando novas...`);
      
      const connection = await pool.getConnection();
      try {
        await generateUserTeamMatches(connection, teamId);
      } finally {
        connection.release();
      }
    }
    
    // Buscar partidas após as correções
    const query = `
      SELECT m.*, 
        ht.name as home_team_name, at.name as away_team_name,
        c.name as competition_name, c.type as competition_type
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE (m.home_team_id = ? OR away_team_id = ?) 
      AND m.season_id = ?
      ORDER BY m.match_date, m.match_time
    `;
    
    const [matches] = await pool.query(query, [teamId, teamId, season_id]);
    
    console.log(`Encontrados ${matches.length} jogos no calendário após correções`);
    
    res.json(matches);
  } catch (err) {
    console.error('Erro ao buscar calendário:', err);
    res.status(500).json({ error: 'Erro ao buscar calendário' });
  }
});

// Obter próxima partida
app.get('/api/matches/next/:teamId', async (req, res) => {
  const { teamId } = req.params;
  
  try {
    console.log(`Buscando próxima partida para o time ${teamId}`);
    
    // Primeiro, verificar o time na tabela user_teams (origem dos dados corretos)
    const [userTeamCheck] = await pool.query(
      'SELECT id, name FROM user_teams WHERE id = ?', 
      [teamId]
    );
    
    if (userTeamCheck.length === 0) {
      return res.json({ error: 'Time não encontrado' });
    }
    
    const userTeamName = userTeamCheck[0].name;
    
    // Depois, verificar na tabela teams (deve estar sincronizada)
    const [teamCheck] = await pool.query(
      'SELECT id, name FROM teams WHERE id = ?', 
      [teamId]
    );
    
    // Se os nomes forem diferentes, ressincronizar
    if (teamCheck.length === 0 || teamCheck[0].name !== userTeamName) {
      console.warn(`Discrepância detectada entre tabelas: user_teams(${userTeamName}) vs teams(${teamCheck.length > 0 ? teamCheck[0].name : 'não encontrado'})`);
      
      // Obter uma conexão
      const connection = await pool.getConnection();
      try {
        // Sincronizar as tabelas
        await syncUserTeam(connection, teamId, userTeamName);
      } finally {
        connection.release();
      }
    }
    
    // Agora busca as partidas
    const [matches] = await pool.query(
      `SELECT m.*, 
        ht.name as home_team_name, at.name as away_team_name,
        c.name as competition_name
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       JOIN competitions c ON m.competition_id = c.id
       WHERE (m.home_team_id = ? OR m.away_team_id = ?)
       AND m.status = 'scheduled'
       ORDER BY m.match_date, m.match_time
       LIMIT 1`,
      [teamId, teamId]
    );
    
    console.log(`Encontradas ${matches.length} partidas para o time ${teamId}`);
    
    if (matches.length === 0) {
      // Código existente para quando não há partidas
      // ...
    }

    res.json(matches[0]);
  } catch (error) {
    console.error('Erro ao buscar próxima partida:', error);
    res.status(500).json({ error: 'Erro ao buscar próxima partida' });
  }
});

// Obter detalhes de uma partida específica
app.get('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [matches] = await pool.query(
      `SELECT m.*, 
        ht.name as home_team_name, at.name as away_team_name,
        c.name as competition_name
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       JOIN competitions c ON m.tournament_id = c.id
       WHERE m.id = ?`,
      [id]
    );
    
    if (matches.length === 0) {
      return res.status(404).json({ error: 'Partida não encontrada' });
    }
    
    res.json(matches[0]);
  } catch (err) {
    console.error('Erro ao buscar detalhes da partida:', err);
    res.status(500).json({ error: 'Erro ao buscar detalhes da partida' });
  }
});

// Buscar temporada atual de um time
app.get('/api/teams/:teamId/current-season', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Buscar a temporada atual onde este time está registrado
    const [seasons] = await pool.query(
      `SELECT s.id as seasonId
       FROM seasons s
       JOIN competitions c ON c.season_id = s.id
       JOIN competition_teams ct ON ct.competition_id = c.id
       WHERE ct.team_id = ? AND s.is_current = true
       LIMIT 1`,
      [teamId]
    );
    
    if (seasons.length > 0) {
      res.json({
        success: true,
        seasonId: seasons[0].seasonId
      });
    } else {
      // Não encontrou temporada ativa para este time
      res.json({
        success: false,
        message: 'Nenhuma temporada ativa encontrada para este time'
      });
    }
  } catch (err) {
    console.error('Erro ao buscar temporada atual:', err);
    res.status(500).json({ error: 'Erro ao buscar temporada atual' });
  }
});

// Endpoint para buscar competições do time
app.get('/api/teams/:teamId/competitions', async (req, res) => {
  const { teamId } = req.params;
  
  try {
    console.log(`Buscando competições para o time ${teamId}`);
    
    const [competitions] = await pool.query(
      `SELECT c.*, s.year as season_year
       FROM competitions c
       JOIN competition_teams ct ON c.id = ct.competition_id
       JOIN seasons s ON c.season_id = s.id
       WHERE ct.team_id = ?`,
      [teamId]
    );
    
    console.log(`Time participa de ${competitions.length} competições:`, 
      competitions.map(c => c.name));
    
    res.json(competitions);
  } catch (error) {
    console.error('Erro ao buscar competições do time:', error);
    res.status(500).json({ error: 'Erro ao buscar competições do time' });
  }
});

app.get('/api/competitions', async (req, res) => {
  try {
    const { season_id } = req.query;
    
    if (!season_id) {
      return res.status(400).json({ error: 'ID da temporada é obrigatório' });
    }
    
    console.log(`Buscando competições para a temporada ${season_id}`);
    
    // Primeiro verifique se a temporada existe
    const [seasonCheck] = await pool.query(
      'SELECT id, year, is_current FROM seasons WHERE id = ?',
      [season_id]
    );
    
    if (seasonCheck.length === 0) {
      console.log(`Temporada ${season_id} não encontrada!`);
      return res.status(404).json({ error: 'Temporada não encontrada' });
    }
    
    console.log(`Temporada encontrada: ID ${seasonCheck[0].id}, Ano ${seasonCheck[0].year}, Ativa: ${seasonCheck[0].is_current}`);
    
    // Agora buscar as competições
    const [competitions] = await pool.query(
      'SELECT * FROM competitions WHERE season_id = ? ORDER BY type',
      [season_id]
    );
    
    console.log(`Encontradas ${competitions.length} competições para a temporada ${season_id}`);
    
    // Se não encontrou competições, buscar a temporada ativa
    if (competitions.length === 0) {
      console.log("Nenhuma competição encontrada, verificando temporada atual...");
      
      const [currentSeason] = await pool.query(
        'SELECT id FROM seasons WHERE is_current = true'
      );
      
      if (currentSeason.length > 0) {
        const currentSeasonId = currentSeason[0].id;
        
        if (currentSeasonId !== parseInt(season_id)) {
          console.log(`A temporada atual é ${currentSeasonId}, diferente da solicitada ${season_id}`);
          
          // Verificar se existem competições para a temporada atual
          const [currentCompetitions] = await pool.query(
            'SELECT * FROM competitions WHERE season_id = ? ORDER BY type',
            [currentSeasonId]
          );
          
          console.log(`Encontradas ${currentCompetitions.length} competições na temporada atual ${currentSeasonId}`);
          
          if (currentCompetitions.length > 0) {
            return res.json(currentCompetitions);
          }
        }
      }
    }
    
    res.json(competitions);
  } catch (err) {
    console.error('Erro ao buscar competições:', err);
    res.status(500).json({ error: 'Erro ao buscar competições' });
  }
});

// Endpoint para buscar partidas por competição:
app.get('/api/competitions/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;
    const { team_id } = req.query;
    
    let query = `
      SELECT m.*, 
        ht.name as home_team_name, at.name as away_team_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.competition_id = ?
    `;
    
    // Se especificou team_id, filtrar apenas jogos deste time
    if (team_id) {
      query += ` AND (m.home_team_id = ? OR m.away_team_id = ?)`;
      query += ` ORDER BY m.match_date, m.match_time`;
      
      const [matches] = await pool.query(query, [id, team_id, team_id]);
      res.json(matches);
    } else {
      query += ` ORDER BY m.match_date, m.match_time`;
      
      const [matches] = await pool.query(query, [id]);
      res.json(matches);
    }
  } catch (err) {
    console.error('Erro ao buscar partidas da competição:', err);
    res.status(500).json({ error: 'Erro ao buscar partidas da competição' });
  }
});

// Endpoint para obter detalhes de uma competição específica
// Obter classificação de uma competição
app.get('/api/competitions/:id/standings', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [standings] = await pool.query(
      `SELECT s.*, t.name as team_name
       FROM standings s
       JOIN teams t ON s.team_id = t.id
       WHERE s.competition_id = ?
       ORDER BY s.group_name, s.position`,
      [id]
    );
    
    res.json(standings);
  } catch (err) {
    console.error('Erro ao buscar classificação:', err);
    res.status(500).json({ error: 'Erro ao buscar classificação' });
  }
});

// Simular uma partida
app.post('/api/matches/:id/simulate', async (req, res) => {
  const { id } = req.params;
  const { userTactics } = req.body;
  
  try {
    // Buscar informações da partida
    const [matches] = await pool.query('SELECT * FROM matches WHERE id = ?', [id]);
    
    if (matches.length === 0) {
      return res.status(404).json({ error: 'Partida não encontrada' });
    }
    
    const match = matches[0];
    
    // Implementar lógica de simulação aqui...
    // Esta parte será complexa - vamos simular um resultado temporário
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 3);
    
    // Atualizar o resultado da partida
    await pool.query(
      'UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE id = ?',
      [homeScore, awayScore, 'completed', id]
    );
    
    // Atualizar a tabela de classificação
    await updateStandings(match.competition_id, match.home_team_id, match.away_team_id, homeScore, awayScore);
    
    res.json({ 
      success: true, 
      result: { 
        homeScore, 
        awayScore 
      }
    });
  } catch (err) {
    console.error('Erro ao simular partida:', err);
    res.status(500).json({ error: 'Erro ao simular partida' });
  }
});

async function registerUserTeamInCompetitions(connection, teamId, seasonId) {
  try {
    // Buscar IDs reais das competições na temporada atual
    const [competitions] = await connection.query(
      'SELECT id, name FROM competitions WHERE season_id = ?',
      [seasonId]
    );
    
    if (competitions.length === 0) {
      console.error(`ERRO: Nenhuma competição encontrada para a temporada ${seasonId}`);
      return false;
    }
    
    // Registrar em todas as competições da temporada
    for (const comp of competitions) {
      try {
        await connection.query(
          'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
          [comp.id, teamId]
        );
        console.log(`Time ID ${teamId} registrado na competição "${comp.name}" (ID: ${comp.id})`);
      } catch (err) {
        // Ignorar erros de duplicação (se o time já estiver registrado)
        if (!err.message.includes('Duplicate entry')) {
          throw err;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao registrar time ${teamId} nas competições:`, error);
    throw error;
  }
}

async function updateStandings(competitionId, homeTeamId, awayTeamId, homeScore, awayScore) {
  // Implementar atualização da tabela de classificação
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Atualizar time da casa
    await updateTeamStanding(connection, competitionId, homeTeamId, homeScore > awayScore, homeScore === awayScore, homeScore < awayScore, homeScore, awayScore);
    
    // Atualizar time visitante
    await updateTeamStanding(connection, competitionId, awayTeamId, awayScore > homeScore, homeScore === awayScore, awayScore < homeScore, awayScore, homeScore);
    
    // Recalcular posições
    await recalculatePositions(connection, competitionId);
    
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// Endpoint para popular o banco de dados com times
app.post('/api/admin/seed-teams', async (req, res) => {
  try {
    await seedTeams();
    res.json({ success: true, message: 'Times adicionados com sucesso!' });
  } catch (error) {
    console.error('Erro ao adicionar times:', error);
    res.status(500).json({ error: 'Erro ao adicionar times' });
  }
});

// Endpoint para associar times às competições
app.post('/api/admin/associate-teams', async (req, res) => {
  try {
    await associateTeamsToCompetitions();
    res.json({ success: true, message: 'Times associados às competições com sucesso!' });
  } catch (error) {
    console.error('Erro ao associar times:', error);
    res.status(500).json({ error: 'Erro ao associar times às competições' });
  }
});

// Endpoint para gerar partidas para todas as competições
app.post('/api/admin/generate-fixtures', async (req, res) => {
  try {
    await generateFixturesForAllCompetitions();
    res.json({ success: true, message: 'Partidas geradas com sucesso!' });
  } catch (error) {
    console.error('Erro ao gerar partidas:', error);
    res.status(500).json({ error: 'Erro ao gerar partidas' });
  }
});

// Endpoint apenas para ambiente de desenvolvimento
app.delete('/api/dev/clear-test-data', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Esta rota só está disponível em ambiente de desenvolvimento' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    try {
      // Buscar IDs de times de usuário
      const [userTeams] = await connection.query('SELECT id FROM teams WHERE is_user_team = true');
      const userTeamIds = userTeams.map(team => team.id);
      
      if (userTeamIds.length > 0) {
        // Usando placeholders (?) para cada ID na lista
        const placeholders = userTeamIds.map(() => '?').join(',');
        
        await connection.query(`DELETE FROM user_team_players WHERE team_id IN (${placeholders})`, userTeamIds);
        await connection.query(`DELETE FROM competition_teams WHERE team_id IN (${placeholders})`, userTeamIds);
        
        // Remover da tabela user_teams
        await connection.query(`DELETE FROM user_teams WHERE id IN (${placeholders})`, userTeamIds);
        
        // Por último, remover da tabela teams
        await connection.query(`DELETE FROM teams WHERE id IN (${placeholders})`, userTeamIds);
      }
      
      res.json({ 
        success: true, 
        message: `Dados de teste removidos: ${userTeamIds.length} time(s) excluído(s)` 
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Erro ao limpar dados de teste:', err);
    res.status(500).json({ error: 'Erro ao limpar dados de teste' });
  }
});

// Adicione este novo endpoint antes do app.listen(3001)

// Salvar configuração completa do time
app.put('/api/teams/:teamId/save-configuration', async (req, res) => {
  const { teamId } = req.params;
  const { 
    formation, 
    tactic, 
    play_style, 
    captain,
    penaltyTaker, 
    freeKickTaker, 
    cornerTaker, 
    starters, 
    reserves 
  } = req.body;
  
  console.log(`Salvando configuração do time ${teamId}:`, { formation, tactic, play_style });
  
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Atualizar formação, tática e estilo de jogo na tabela user_teams
      await connection.query(
        `UPDATE user_teams 
         SET formation = ?, tactic = ?, play_style = ?
         WHERE id = ?`,
        [formation, tactic, play_style, teamId]
      );
      
      // 2. Resetar todos os papéis e titularidade
      await connection.query(
        `UPDATE user_team_players 
         SET is_captain = 0, is_penalty_taker = 0, 
             is_freekick_taker = 0, is_corner_taker = 0,
             is_starter = 0
         WHERE team_id = ?`,
        [teamId]
      );
      
      // 3. Definir titulares
      if (starters && starters.length > 0) {
        for (let i = 0; i < starters.length; i++) {
          await connection.query(
            `UPDATE user_team_players 
             SET is_starter = 1, position = ?
             WHERE team_id = ? AND player_id = ?`,
            [i + 1, teamId, starters[i]]
          );
        }
      }
      
      // 4. Definir reservas
      if (reserves && reserves.length > 0) {
        for (let i = 0; i < reserves.length; i++) {
          await connection.query(
            `UPDATE user_team_players 
             SET is_starter = 0, position = ?
             WHERE team_id = ? AND player_id = ?`,
            [i + 12, teamId, reserves[i]]
          );
        }
      }
      
      // 5. Definir papéis especiais
      if (captain) {
        await connection.query(
          `UPDATE user_team_players 
           SET is_captain = 1
           WHERE team_id = ? AND player_id = ?`,
          [teamId, captain]
        );
      }
      
      if (penaltyTaker) {
        await connection.query(
          `UPDATE user_team_players 
           SET is_penalty_taker = 1
           WHERE team_id = ? AND player_id = ?`,
          [teamId, penaltyTaker]
        );
      }
      
      if (freeKickTaker) {
        await connection.query(
          `UPDATE user_team_players 
           SET is_freekick_taker = 1
           WHERE team_id = ? AND player_id = ?`,
          [teamId, freeKickTaker]
        );
      }
      
      if (cornerTaker) {
        await connection.query(
          `UPDATE user_team_players 
           SET is_corner_taker = 1
           WHERE team_id = ? AND player_id = ?`,
          [teamId, cornerTaker]
        );
      }
      
      await connection.commit();
      console.log(`Configuração do time ${teamId} salva com sucesso`);
      res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao salvar configuração do time:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao salvar configuração do time:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

app.listen(3001, () => {
  console.log('API rodando em http://localhost:3001');
});

// Função principal para iniciar temporada
async function initializeFirstSeason(connection, userId, teamId) {
  try {
    // 1. Buscar informações do time
    const [teamData] = await connection.query(
      'SELECT name FROM user_teams WHERE id = ?',
      [teamId]
    );
    
    if (teamData.length === 0) {
      throw new Error(`Time com ID ${teamId} não encontrado`);
    }
    
    const teamName = teamData[0].name;
    console.log(`Criando nova temporada para time: ${teamName} (ID: ${teamId})`);
    
    // 2. Limpar dados de temporadas anteriores (sem acessar tabelas inexistentes)
    await cleanupExistingData(connection, teamId);
    console.log(`Dados de temporadas anteriores limpos para o time ${teamName}`); 

    // 3. Criar nova temporada
    const [result] = await connection.query(
      'INSERT INTO seasons (year, is_current, status) VALUES (?, true, "active")',
      [2024]// Ano fixo em 2024 em vez de new Date().getFullYear()
    );
    const seasonId = result.insertId;
    console.log(`Nova temporada criada com ID: ${seasonId}`);
    
    // 4. Criar competições para esta temporada
    await createDefaultCompetitions(connection, seasonId);
    console.log(`Competições criadas para a temporada ID: ${seasonId}`);
    
    // 5. Garantir que o time exista na tabela teams
    await syncUserTeam(connection, teamId, teamName);
    console.log(`Time ${teamName} (ID: ${teamId}) sincronizado com a tabela teams`);
    
    // 6. Registrar time nas competições
    console.log(`Registrando time ${teamName} (ID: ${teamId}) nas competições`);
    await registerUserTeamInCompetitions(connection, teamId, seasonId);
    
    // 7. Gerar partidas para este time com datas corretas
    console.log("Gerando partidas para o time do usuário...");
    await generateUserTeamMatches(connection, teamId);
    
    return seasonId;
  } catch (error) {
    console.error("Erro ao inicializar temporada:", error);
    throw error;
  }
}
// Função para sincronizar time do usuário entre tabelas
async function syncUserTeam(connection, teamId, teamName = null) {
  try {
    console.log(`Sincronizando time ID ${teamId} entre tabelas...`);
    
    // 1. Buscar dados do time do usuário se o nome não foi fornecido
    if (!teamName) {
      const [userTeam] = await connection.query(
        'SELECT name FROM user_teams WHERE id = ?', 
        [teamId]
      );
      
      if (userTeam.length === 0) {
        throw new Error(`Time com ID ${teamId} não encontrado na tabela user_teams`);
      }
      
      teamName = userTeam[0].name;
    }
    
    // 2. IMPORTANTE: Marcar TODOS os outros times como não-usuário
    await connection.query(
      'UPDATE teams SET is_user_team = false'
    );
    
    // 3. Verificar se o time já existe na tabela teams
    const [existingTeam] = await connection.query(
      'SELECT id, name FROM teams WHERE id = ?',
      [teamId]
    );
    
    if (existingTeam.length > 0) {
      // 3a. Atualizar o time existente
      await connection.query(
        'UPDATE teams SET name = ?, is_user_team = true WHERE id = ?',
        [teamName, teamId]
      );
      console.log(`Time ID ${teamId} atualizado na tabela teams`);
    } else {
      // 3b. Inserir o time se não existir
      await connection.query(
        'INSERT INTO teams (id, name, is_user_team) VALUES (?, ?, true)',
        [teamId, teamName]
      );
      console.log(`Time ID ${teamId} inserido na tabela teams`);
    }
    
    // 4. Verificar times com nomes duplicados e renomeá-los
    await connection.query(
      'UPDATE teams SET name = CONCAT(name, " (CPU)") WHERE name = ? AND id != ?',
      [teamName, teamId]
    );
    
    return true;
  } catch (error) {
    console.error("Erro ao sincronizar time do usuário:", error);
    throw error;
  }
}

// Função createDefaultCompetitions para garantir que as competições 
// Sejam criadas para a temporada correta e definir status como "Active"
async function createDefaultCompetitions(connection, seasonId) {
  try {
    console.log(`Criando competições para a temporada ID: ${seasonId}`);
    
    // Lista de competições padrão
    const defaultCompetitions = [
      { name: 'Paulistão A1', type: 'estadual', format: 'league' },
      { name: 'Brasileirão Série A', type: 'nacional', format: 'league' },
      { name: 'Copa do Brasil', type: 'copa', format: 'knockout' },
      { name: 'Copa Libertadores', type: 'continental', format: 'group_knockout' },
      { name: 'Mundial de Clubes', type: 'mundial', format: 'knockout' }
    ];
    
    // Inserir cada competição
    for (const comp of defaultCompetitions) {
      // Verificar se a competição já existe para esta temporada
      const [existing] = await connection.query(
        'SELECT id FROM competitions WHERE name = ? AND season_id = ?',
        [comp.name, seasonId]
      );
      
      // Se não existir, criar
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO competitions (name, type, format, season_id, status) VALUES (?, ?, ?, ?, ?)',
          [comp.name, comp.type, comp.format, seasonId, 'active'] // Alterado de 'upcoming' para 'active'
        );
      }
    }
    
    console.log(`Competições criadas para a temporada ID: ${seasonId}`);
    return true;
  } catch (error) {
    console.error("Erro ao criar competições padrão:", error);
    throw error;
  }
}

// Função para registrar time nas competições
async function registerUserTeamInCompetitions(connection, teamId, seasonId) {
  try {
    // Competições padrão para registrar o time do usuário
    const defaultCompetitions = [1, 2, 3]; // Paulistão, Brasileirão e Copa do Brasil
    
    for (const compId of defaultCompetitions) {
      // Verificar se a associação já existe
      const [existingAssoc] = await connection.query(
        'SELECT * FROM competition_teams WHERE competition_id = ? AND team_id = ?',
        [compId, teamId]
      );
      
      if (existingAssoc.length === 0) {
        await connection.query(
          'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
          [compId, teamId]
        );
        console.log(`Time ID ${teamId} registrado na competição ID ${compId}`);
      } else {
        console.log(`Time ID ${teamId} já registrado na competição ID ${compId}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao registrar time ${teamId} nas competições:`, error);
    throw error;
  }
}

// Endpoint de diagnóstico para verificar o estado do time e suas competições
app.get('/api/diagnostics/team/:teamId', async (req, res) => {
  const { teamId } = req.params;
  
  try {
    // 1. Verificar se o time existe nas tabelas
    const [userTeam] = await pool.query(
      'SELECT * FROM user_teams WHERE id = ?',
      [teamId]
    );
    
    const [team] = await pool.query(
      'SELECT * FROM teams WHERE id = ?',
      [teamId]
    );
    
    // 2. Verificar participação em competições
    const [competitions] = await pool.query(
      `SELECT c.id, c.name, c.type, c.format, c.status 
       FROM competitions c
       JOIN competition_teams ct ON c.id = ct.competition_id
       WHERE ct.team_id = ?`,
      [teamId]
    );
    
    // 3. Verificar partidas agendadas
    const [matches] = await pool.query(
      `SELECT COUNT(*) as match_count 
       FROM matches 
       WHERE home_team_id = ? OR away_team_id = ?`,
      [teamId, teamId]
    );
    
    // 4. Verificar temporada atual
    const [currentSeason] = await pool.query(
      'SELECT * FROM seasons WHERE is_current = 1 LIMIT 1'
    );
    
    res.json({
      user_team: userTeam.length > 0 ? userTeam[0] : null,
      team: team.length > 0 ? team[0] : null,
      competitions: competitions,
      match_count: matches[0].match_count,
      current_season: currentSeason.length > 0 ? currentSeason[0] : null
    });
  } catch (error) {
    console.error('Erro no diagnóstico do time:', error);
    res.status(500).json({ error: 'Erro no diagnóstico do time' });
  }
});

// Nova função para limpar apenas dados existentes
async function cleanupExistingData(connection, teamId) {
  try {
    console.log(`Limpando dados existentes para o time ${teamId}...`);
    
    // 1. Tornar todas as temporadas inativas
    await connection.query('UPDATE seasons SET is_current = false');
    
    // 2. Remover partidas do time
    const [deleteMatchResult] = await connection.query(
      'DELETE FROM matches WHERE home_team_id = ? OR away_team_id = ?',
      [teamId, teamId]
    );
    console.log(`${deleteMatchResult.affectedRows} partidas removidas para o time ID ${teamId}`);
    
    // 3. Remover associações do time com competições
    const [deleteCompResult] = await connection.query(
      'DELETE FROM competition_teams WHERE team_id = ?',
      [teamId]
    );
    console.log(`${deleteCompResult.affectedRows} associações de competição removidas para o time ID ${teamId}`);
    
    // 4. Limpar classificações (standings) do time
    await connection.query(
      'DELETE FROM standings WHERE team_id = ?',
      [teamId]
    );
    
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados existentes:', error);
    // Continue a execução mesmo com erro na limpeza
    return false;
  }
}