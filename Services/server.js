const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

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

app.listen(3001, () => {
  console.log('API rodando em http://localhost:3001');
});