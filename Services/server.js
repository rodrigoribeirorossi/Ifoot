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

// Buscar jogadores por posição (retorna 3 aleatórios)
app.get('/api/jogadores', async (req, res) => {
  const { position } = req.query;
  try {
    const query =
      position === 'Qualquer'
        ? 'SELECT * FROM jogadores ORDER BY RAND() LIMIT 3'
        : 'SELECT * FROM jogadores WHERE position = ? ORDER BY RAND() LIMIT 3';
    const [rows] =
      position === 'Qualquer'
        ? await pool.query(query)
        : await pool.query(query, [position]);
    res.json(rows);
  } catch (err) {
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