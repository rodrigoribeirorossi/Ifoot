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

// Atualizar o endpoint para filtrar jogadores já escolhidos
app.get('/api/jogadores', async (req, res) => {
  const { position, exclude } = req.query;
  let excludeIds = [];
  
  // Processa os IDs a serem excluídos, se houver
  if (exclude && exclude.length > 0) {
    excludeIds = exclude.split(',').map(id => parseInt(id, 10));
  }
  
  try {
    let query;
    let params = [];
    
    // Construa a consulta SQL dinamicamente baseada nos parâmetros
    if (position === 'Qualquer') {
      if (excludeIds.length > 0) {
        query = 'SELECT * FROM jogadores WHERE id NOT IN (?) ORDER BY RAND() LIMIT 3';
        params = [excludeIds];
      } else {
        query = 'SELECT * FROM jogadores ORDER BY RAND() LIMIT 3';
      }
    } else {
      if (excludeIds.length > 0) {
        query = 'SELECT * FROM jogadores WHERE position = ? AND id NOT IN (?) ORDER BY RAND() LIMIT 3';
        params = [position, excludeIds];
      } else {
        query = 'SELECT * FROM jogadores WHERE position = ? ORDER BY RAND() LIMIT 3';
        params = [position];
      }
    }
    
    // MySQL não aceita arrays diretamente em NOT IN, precisamos formatá-los
    query = query.replace('NOT IN (?)', excludeIds.length > 0 
      ? `NOT IN (${excludeIds.map(() => '?').join(',')})`
      : '');
    
    // Ajuste os parâmetros se houver IDs excluídos
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

// ... outros endpoints para editar, excluir, listar todos, etc.

app.listen(3001, () => {
  console.log('API rodando em http://localhost:3001');
});