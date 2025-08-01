const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { seedTeams, associateTeamsToCompetitions } = require('./seed-data');
const { generateFixturesForAllCompetitions } = require('./generate-fixtures');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/assets', express.static('public/assets'));

// Configure sua conexão MySQL
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root', // ou outro usuário criado
  password: 'AQWzsx2éàé(1', // senha definida na instalação
  database: 'ifoot',
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
    
    // Adicionando filtro de status = 'retired' para mostrar apenas aposentados
    if (position === 'Qualquer') {
      if (excludeIds.length > 0) {
        query = 'SELECT * FROM jogadores WHERE status = "retired" AND id NOT IN (?) ORDER BY RAND() LIMIT 3';
        params = [excludeIds];
      } else {
        query = 'SELECT * FROM jogadores WHERE status = "retired" ORDER BY RAND() LIMIT 3';
      }
    } else {
      if (excludeIds.length > 0) {
        query = 'SELECT * FROM jogadores WHERE status = "retired" AND position = ? AND id NOT IN (?) ORDER BY RAND() LIMIT 3';
        params = [position, excludeIds];
      } else {
        query = 'SELECT * FROM jogadores WHERE status = "retired" AND position = ? ORDER BY RAND() LIMIT 3';
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
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
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

app.post('/api/save-team', async (req, res) => {
  const { teamName, userId, formation, players, budgetRemaining, teamValue } = req.body;
  
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Inserir o time
      const [teamResult] = await connection.query(
        'INSERT INTO user_teams (name, user_id, formation, budget_remaining, team_value) VALUES (?, ?, ?, ?, ?)',
        [teamName, userId, formation, budgetRemaining, teamValue]
      );
      
      const teamId = teamResult.insertId;
      
      // 2. Inserir os jogadores do time
      const playerValues = players.map((player, index) => {
        const isStarter = index < 11; // primeiros 11 são titulares
        return [teamId, player.id, isStarter, index + 1]; // position começa em 1
      });
      
      if (playerValues.length > 0) {
        await connection.query(
          'INSERT INTO user_team_players (team_id, player_id, is_starter, position) VALUES ?',
          [playerValues]
        );
      }
      
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
    
    // Buscar jogadores do time usando as tabelas corretas
    const [players] = await pool.query(
      `SELECT j.id, j.name, j.position, j.overall, j.photo_url, 
              utp.is_starter as isStarter, utp.is_captain as isCaptain, 
              utp.is_penalty_taker as isPenaltyTaker, utp.is_freekick_taker as isFreekickTaker,
              utp.is_corner_taker as isCornerTaker,
              100 as energy, false as isInjured, false as isSuspended
       FROM user_team_players utp
       JOIN jogadores j ON utp.player_id = j.id
       WHERE utp.team_id = ?
       ORDER BY utp.is_starter DESC, j.overall DESC`,
      [teamId]
    );
    
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
    const playerCount = parseInt(count) || 23; // 11 titulares + 12 reservas
    
    // Buscar jogadores com overall < 80, aleatoriamente
    const [rows] = await pool.query(
      'SELECT * FROM jogadores WHERE overall < 80 AND status = "retired" ORDER BY RAND() LIMIT ?',
      [playerCount]
    );
    
    // Garantir que temos pelo menos um goleiro
    const hasGoalkeeper = rows.some(player => player.position === 'Goleiro');
    
    if (!hasGoalkeeper && playerCount > 1) {
      const [goalkeepers] = await pool.query(
        'SELECT * FROM jogadores WHERE overall < 80 AND position = "Goleiro" AND status = "retired" ORDER BY RAND() LIMIT 1'
      );
      
      if (goalkeepers.length > 0) {
        // Substituir um jogador qualquer pelo goleiro
        rows[0] = goalkeepers[0];
      }
    }
    
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
  const { user_team_id } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar se já existe uma temporada ativa para este time
      const [existingSeason] = await connection.query(
        `SELECT s.id FROM seasons s 
         JOIN competitions c ON c.season_id = s.id
         JOIN competition_teams ct ON ct.competition_id = c.id
         WHERE ct.team_id = ? AND s.status = 'active'`,
        [user_team_id]
      );
      
      if (existingSeason.length > 0) {
        await connection.commit();
        return res.json({ success: true, seasonId: existingSeason[0].id, message: 'Temporada já iniciada' });
      }
      
      // 1. Certificar-se de que todos os times base estão no banco de dados
      await seedTeams();
      
      // 2. Inicializar a primeira temporada com o ano correto (2024)
      const seasonId = await initializeFirstSeason(connection, req.body.userId, user_team_id);
      
      await connection.commit();
      res.json({ success: true, seasonId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Erro ao iniciar temporada:', err);
    res.status(500).json({ error: 'Erro ao iniciar temporada', message: err.message });
  }
});

// Nova função adaptada para usar a conexão e seasonId existentes
async function generateFixturesForCompetitionsBySeason(connection, seasonId) {
  // Obter todas as competições ativas para esta temporada
  const [competitions] = await connection.query(
    'SELECT id, name, type, format FROM competitions WHERE season_id = ? AND status = "active"',
    [seasonId]
  );
  
  if (competitions.length === 0) {
    console.log("Não há competições ativas para gerar partidas.");
    return;
  }
  
  // Processar cada competição
  for (const competition of competitions) {
    try {
      console.log(`\nGerando jogos para ${competition.name}...`);
      
      // Obter times nesta competição
      const [teams] = await connection.query(
        'SELECT t.* FROM teams t ' +
        'JOIN competition_teams ct ON t.id = ct.team_id ' +
        'WHERE ct.competition_id = ?',
        [competition.id]
      );
      
      if (teams.length < 2) {
        console.log(`Competição ${competition.name} não tem times suficientes para gerar jogos.`);
        continue;
      }
      
      console.log(`${teams.length} times encontrados para a competição.`);
      
      // Importar as funções necessárias do generate-fixtures.js
      const { 
        generateLeagueFixtures, 
        generateKnockoutFixtures, 
        generateGroupKnockoutFixtures,
        initializeStandings 
      } = require('./generate-fixtures');
      
      // Gerar partidas com base no formato da competição
      if (competition.format === 'league') {
        await generateLeagueFixtures(connection, competition.id, teams);
      } else if (competition.format === 'knockout') {
        await generateKnockoutFixtures(connection, competition.id, teams);
      } else if (competition.format === 'group_knockout') {
        await generateGroupKnockoutFixtures(connection, competition.id, teams);
      }
      
      // Inicializar a tabela de classificação (standings)
      await initializeStandings(connection, competition.id, teams);
    } catch (error) {
      console.error(`Erro ao gerar partidas para ${competition.name}:`, error);
      throw error; // Re-throw para ser pego pelo try/catch principal
    }
  }
}

// Obter calendário de jogos
app.get('/api/calendar/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { season_id } = req.query;
  
  try {
    let query = `
      SELECT m.*, 
        ht.name as home_team_name, at.name as away_team_name,
        c.name as competition_name, c.type as competition_type
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE (m.home_team_id = ? OR m.away_team_id = ?)
      AND c.season_id = ?
      ORDER BY m.match_date, m.match_time
    `;
    
    const [matches] = await pool.query(query, [teamId, teamId, season_id]);
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
    
    // Primeiro, verificar se o time existe na tabela teams
    const [teamCheck] = await pool.query('SELECT id, name FROM teams WHERE id = ?', [teamId]);
    console.log('Time encontrado:', teamCheck);
    
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
    
    console.log(`Encontradas ${matches.length} partidas para o team ${teamId}`);
    
    if (matches.length === 0) {
      console.log('Nenhuma partida encontrada, verificando competições do time...');
      
      // Verificar em quais competições o time está inscrito
      const [competitions] = await pool.query(
        `SELECT c.id, c.name FROM competitions c
         JOIN competition_teams ct ON c.id = ct.competition_id
         WHERE ct.team_id = ?`,
        [teamId]
      );
      
      console.log(`Time participa de ${competitions.length} competições:`, competitions);
    }
    
    res.json(matches.length === 0 ? null : matches[0]);
  } catch (err) {
    console.error('Erro ao buscar próxima partida:', err);
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
      res.json({ seasonId: seasons[0].seasonId });
    } else {
      res.json({ seasonId: null });
    }
  } catch (err) {
    console.error('Erro ao buscar temporada atual:', err);
    res.status(500).json({ error: 'Erro ao buscar temporada atual' });
  }
});

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

// Funções auxiliares a serem implementadas
async function createCompetitionsForSeason(connection, seasonId, year) {
  // Criar competições padrão
  const competitions = [
    { name: 'Paulistão A1', type: 'estadual', format: 'league' },
    { name: 'Brasileirão Série A', type: 'nacional', format: 'league' },
    { name: 'Copa do Brasil', type: 'copa', format: 'knockout' },
    { name: 'Copa Libertadores', type: 'continental', format: 'group_knockout' },
    { name: 'Mundial de Clubes', type: 'mundial', format: 'knockout' }
  ];
  
  for (const comp of competitions) {
    await connection.query(
      'INSERT INTO competitions (name, type, season_id, format, status) VALUES (?, ?, ?, ?, ?)',
      [comp.name, comp.type, seasonId, comp.format, 'active']
    );
  }
}

async function registerUserTeamInCompetitions(connection, userTeamId, seasonId) {
  try {
    console.log(`Verificando time ${userTeamId} nas tabelas...`);
    
    // Verificar se o time já existe na tabela teams
    const [existingTeam] = await connection.query(
      'SELECT id FROM teams WHERE id = ?',
      [userTeamId]
    );
    
    // Se não existir, inserir o time na tabela teams primeiro
    if (existingTeam.length === 0) {
      // Buscar detalhes do time do usuário
      const [userTeam] = await connection.query(
        'SELECT name FROM user_teams WHERE id = ?',
        [userTeamId]
      );
      
      console.log(`Resultados da busca do time ${userTeamId}:`, userTeam);
      
      if (userTeam.length > 0) {
        // Inserir o time na tabela teams
        await connection.query(
          'INSERT INTO teams (id, name, strength, is_user_team) VALUES (?, ?, ?, ?)',
          [userTeamId, userTeam[0].name, 70, true]
        );
        console.log(`Time do usuário ${userTeam[0].name} (ID: ${userTeamId}) inserido na tabela teams.`);
      } else {
        throw new Error(`Time de usuário com ID ${userTeamId} não encontrado na tabela user_teams.`);
      }
    }
    
    // Buscar competições estaduais e nacionais para o primeiro ano
    const [competitions] = await connection.query(
      'SELECT id, type FROM competitions WHERE season_id = ? AND (type = ? OR type = ? OR type = ?)',
      [seasonId, 'estadual', 'nacional', 'copa']
    );
    
    // Agora registrar o time do usuário nas competições iniciais
    for (const comp of competitions) {
      await connection.query(
        'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
        [comp.id, userTeamId]
      );
    }
  } catch (error) {
    console.error('Erro ao registrar time nas competições:', error);
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

app.listen(3001, () => {
  console.log('API rodando em http://localhost:3001');
});

// Função principal para iniciar temporada
async function initializeFirstSeason(connection, userId, teamId) {
  // Começar com ano 2024
  const year = 2024;
  
  // 1. Criar a temporada
  const [seasonResult] = await connection.query(
    'INSERT INTO seasons (year, is_current, status) VALUES (?, true, ?)',
    [year, 'active']
  );
  const seasonId = seasonResult.insertId;
  
  // 2. Criar competições da temporada
  await createCompetitionsForSeason(connection, seasonId, year);
  
  // 3. Também precisamos definir essas funções ausentes:
  await seedAndAssociateTeams(connection, seasonId);

  // 3. Popular competições com times (usando seed-data.js)
  //await populateCompetitionsWithTeams(connection, seasonId);
  
  // 4. Associar o time do usuário apenas às competições apropriadas para um time recém-promovido
  await registerUserTeamInAppropriateCompetitions(connection, teamId, seasonId);
  
  // 5. Gerar o calendário completo
  await generateFixturesForCompetitionsBySeason(connection, seasonId);
  
  return seasonId;
}

async function registerUserTeamInAppropriateCompetitions(connection, teamId, seasonId) {
  // Verificar se o time já existe na tabela teams
  const [existingTeam] = await connection.query(
    'SELECT id FROM teams WHERE id = ?',
    [teamId]
  );
  
  if (existingTeam.length === 0) {
    // Inserir o time do usuário na tabela teams
    const [userTeam] = await connection.query('SELECT name FROM user_teams WHERE id = ?', [teamId]);
    await connection.query(
      'INSERT INTO teams (id, name, strength, is_user_team) VALUES (?, ?, ?, ?)',
      [teamId, userTeam[0].name, 70, true]
    );
  }
  
  // Como time recém-promovido, participará apenas de:
  // 1. Paulistão (estadual)
  // 2. Brasileirão Série A (como time promovido)
  // 3. Copa do Brasil
  const competitionTypes = ['estadual', 'nacional', 'copa'];
  
  const [competitions] = await connection.query(
    'SELECT id FROM competitions WHERE season_id = ? AND type IN (?) AND id NOT IN (SELECT competition_id FROM competition_teams WHERE team_id = ?)',
    [seasonId, competitionTypes, teamId]
  );
  
  // Registrar o time em cada competição
  for (const comp of competitions) {
    await connection.query(
      'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
      [comp.id, teamId]
    );
  }
}

// Adicione esta função auxiliar após initializeFirstSeason
async function seedAndAssociateTeams(connection, seasonId) {
  try {
    console.log("Verificando e adicionando times às competições...");
    
    // Verificar se já existem times na tabela teams
    const [teamsCount] = await connection.query('SELECT COUNT(*) as count FROM teams');
    
    if (teamsCount[0].count <= 1) { // Se só tiver o time do usuário
      console.log("Populando tabela de times...");
      // Esta função importa do seed-data.js e não precisa de conexão
      await seedTeams();
    }
    
    // Obter todas as competições desta temporada
    const [competitions] = await connection.query(
      'SELECT id, type FROM competitions WHERE season_id = ?',
      [seasonId]
    );
    
    // Para cada competição, associar os times apropriados
    for (const comp of competitions) {
      // Obter times apropriados para esta competição com base em seu tipo
      let teamQuery;
      let teamIds = [];
      
      if (comp.type === 'estadual') {
        // Para estadual, buscar times com IDs entre 201-215 (Paulistão)
        teamQuery = 'SELECT id FROM teams WHERE id BETWEEN 201 AND 215 AND is_user_team = 0';
      } else if (comp.type === 'nacional') {
        // Para nacional, buscar times com IDs entre 101-119 (Brasileirão)
        teamQuery = 'SELECT id FROM teams WHERE id BETWEEN 101 AND 119 AND is_user_team = 0';
      } else if (comp.type === 'copa') {
        // Para copa, combinar times estaduais e nacionais
        teamQuery = 'SELECT id FROM teams WHERE (id BETWEEN 101 AND 119 OR id BETWEEN 201 AND 215) AND is_user_team = 0 LIMIT 32';
      } else if (comp.type === 'continental') {
        // Para continental, buscar times da Libertadores (301-320)
        teamQuery = 'SELECT id FROM teams WHERE id BETWEEN 301 AND 320 AND is_user_team = 0';
      } else if (comp.type === 'mundial') {
        // Para mundial, buscar times internacionais (401-412)
        teamQuery = 'SELECT id FROM teams WHERE id BETWEEN 401 AND 412 AND is_user_team = 0';
      }
      
      // Se temos uma consulta, buscar os times
      if (teamQuery) {
        const [teams] = await connection.query(teamQuery);
        teamIds = teams.map(t => t.id);
        
        // Associar times à competição
        for (const teamId of teamIds) {
          // Verificar se já está associado
          const [existing] = await connection.query(
            'SELECT 1 FROM competition_teams WHERE competition_id = ? AND team_id = ?',
            [comp.id, teamId]
          );
          
          if (existing.length === 0) {
            await connection.query(
              'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
              [comp.id, teamId]
            );
          }
        }
        
        console.log(`${teamIds.length} times associados à competição ${comp.id}`);
      }
    }
  } catch (error) {
    console.error("Erro ao associar times às competições:", error);
    throw error;
  }
}

async function generateFullCalendar(connection, seasonId) {
  // 1. Obter todas as competições da temporada
  const [competitions] = await connection.query(
    'SELECT id, name, type, format FROM competitions WHERE season_id = ?',
    [seasonId]
  );
  
  // 2. Definir datas iniciais para cada competição (calendário realista)
  const startDates = {
    'estadual': new Date(2024, 0, 15),  // 15 de Janeiro
    'nacional': new Date(2024, 3, 10),  // 10 de Abril (após estadual)
    'copa': new Date(2024, 1, 20),      // 20 de Fevereiro
    'continental': new Date(2024, 3, 5), // 5 de Abril
    'mundial': new Date(2024, 11, 10)    // 10 de Dezembro
  };
  
  // 3. Gerar partidas para cada competição com suas datas específicas
  for (const competition of competitions) {
    const teams = await getTeamsForCompetition(connection, competition.id);
    
    if (teams.length >= 2) {
      const startDate = startDates[competition.type] || new Date();
      
      if (competition.format === 'league') {
        await generateLeagueFixturesWithRealDates(connection, competition.id, teams, startDate);
      } else if (competition.format === 'knockout') {
        await generateKnockoutFixturesWithRealDates(connection, competition.id, teams, startDate);
      } else if (competition.format === 'group_knockout') {
        await generateGroupKnockoutFixturesWithRealDates(connection, competition.id, teams, startDate);
      }
    }
  }
}

// Endpoint para salvar configuração do time
app.put('/api/teams/:teamId/save-configuration', async (req, res) => {
  const { teamId } = req.params;
  const { 
    formation,
    tactic,
    playStyle, 
    captain,
    penaltyTaker,
    freeKickTaker,
    cornerTaker,
    starters,
    reserves
  } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Atualizar dados de formação e táticas
      await connection.query(
        'UPDATE user_teams SET formation = ?, tactic = ?, play_style = ? WHERE id = ?',
        [formation, tactic, playStyle, teamId]
      );
      
      // Resetar papéis especiais
      await connection.query(
        'UPDATE user_team_players SET is_captain = 0, is_penalty_taker = 0, ' +
        'is_freekick_taker = 0, is_corner_taker = 0 WHERE team_id = ?',
        [teamId]
      );
      
      // Definir papéis especiais
      if (captain) {
        await connection.query(
          'UPDATE user_team_players SET is_captain = 1 WHERE team_id = ? AND player_id = ?',
          [teamId, captain]
        );
      }
      
      if (penaltyTaker) {
        await connection.query(
          'UPDATE user_team_players SET is_penalty_taker = 1 WHERE team_id = ? AND player_id = ?',
          [teamId, penaltyTaker]
        );
      }
      
      if (freeKickTaker) {
        await connection.query(
          'UPDATE user_team_players SET is_freekick_taker = 1 WHERE team_id = ? AND player_id = ?',
          [teamId, freeKickTaker]
        );
      }
      
      if (cornerTaker) {
        await connection.query(
          'UPDATE user_team_players SET is_corner_taker = 1 WHERE team_id = ? AND player_id = ?',
          [teamId, cornerTaker]
        );
      }
      
      // Atualizar titulares e reservas
      if (starters && starters.length > 0) {
        for (let i = 0; i < starters.length; i++) {
          await connection.query(
            'UPDATE user_team_players SET is_starter = 1, position = ? WHERE team_id = ? AND player_id = ?',
            [i + 1, teamId, starters[i]]
          );
        }
      }
      
      if (reserves && reserves.length > 0) {
        for (let i = 0; i < reserves.length; i++) {
          await connection.query(
            'UPDATE user_team_players SET is_starter = 0, position = ? WHERE team_id = ? AND player_id = ?',
            [i + 12, teamId, reserves[i]]
          );
        }
      }
      
      // Calcular e atualizar a força do time na tabela teams
      const overallQuery = await connection.query(
        `SELECT AVG(j.overall) as team_strength
         FROM user_team_players utp
         JOIN jogadores j ON utp.player_id = j.id
         WHERE utp.team_id = ? AND utp.is_starter = 1`,
        [teamId]
      );
      
      const teamStrength = Math.round(overallQuery[0][0].team_strength) || 70;
      
      // Atualizar força do time
      await connection.query(
        'UPDATE teams SET strength = ? WHERE id = ?',
        [teamStrength, teamId]
      );
      
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: 'Erro ao salvar configuração do time' });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Erro ao salvar configuração do time:', err);
    res.status(500).json({ error: 'Erro ao salvar configuração do time' });
  }
});