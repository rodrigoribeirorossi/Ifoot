// Crie este arquivo para executar uma única vez

const mysql = require('mysql2/promise');

async function main() {
  // Configuração de conexão
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'AQWzsx2éàé(1',
    database: 'ifoot_simple',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const connection = await pool.getConnection();
    console.log("Conectado ao banco de dados");

    try {
      // 1. Verificar se a coluna season_id existe
      const [columns] = await connection.query('DESCRIBE matches');
      const hasSeasonId = columns.some(col => col.Field === 'season_id');
      
      if (!hasSeasonId) {
        console.log("Adicionando coluna season_id à tabela matches");
        await connection.query('ALTER TABLE matches ADD COLUMN season_id INT');
        await connection.query('ALTER TABLE matches ADD INDEX (season_id)');
      }
      
      // 2. Buscar partidas sem season_id
      const [matches] = await connection.query(
        'SELECT m.id, c.season_id FROM matches m JOIN competitions c ON m.competition_id = c.id WHERE m.season_id IS NULL'
      );
      
      console.log(`Encontradas ${matches.length} partidas sem season_id`);
      
      // 3. Atualizar cada partida com o season_id da competição
      for (const match of matches) {
        await connection.query(
          'UPDATE matches SET season_id = ? WHERE id = ?',
          [match.season_id, match.id]
        );
      }
      
      console.log("Atualização concluída com sucesso!");
      
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    pool.end();
  }
}

main();