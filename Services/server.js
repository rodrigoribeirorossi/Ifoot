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
    // Atualizar o time com o ID do técnico escolhido
    await pool.query(
      'UPDATE user_teams SET coach_id = ? WHERE id = ?',
      [coachId, teamId]
    );
    
    // Obter o valor do técnico para atualizar o orçamento do time
    const [coaches] = await pool.query('SELECT value FROM tecnicos WHERE id = ?', [coachId]);
    
    if (coaches.length > 0) {
      const coachValue = coaches[0].value;
      
      // Atualizar o orçamento restante do time
      await pool.query(
        'UPDATE user_teams SET budget_remaining = budget_remaining - ? WHERE id = ?',
        [coachValue, teamId]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao salvar técnico:', err);
    res.status(500).json({ error: 'Erro ao salvar o técnico' });
  }
});

// ... outros endpoints para editar, excluir, listar todos, etc.

app.listen(3001, () => {
  console.log('API rodando em http://localhost:3001');
});