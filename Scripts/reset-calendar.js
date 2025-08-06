// Criar este arquivo para executar uma única vez

const mysql = require('mysql2/promise');

async function updateMatchesSeasonId() {
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
    console.log("Conectando ao banco de dados...");
    const connection = await pool.getConnection();
    
    try {
      // 1. Obter a temporada atual
      const [seasons] = await connection.query('SELECT id FROM seasons WHERE is_current = true ORDER BY id DESC LIMIT 1');
      
      if (seasons.length === 0) {
        console.log("Nenhuma temporada ativa encontrada!");
        return;
      }
      
      const seasonId = seasons[0].id;
      console.log(`Temporada atual: ID ${seasonId}`);
      
      // 2. Buscar partidas sem season_id
      const [matches] = await connection.query(
        `SELECT COUNT(*) as count FROM matches WHERE season_id IS NULL`
      );
      
      console.log(`Encontradas ${matches[0].count} partidas sem season_id`);
      
      // 3. Atualizar todas as partidas do time do usuário para a temporada atual
      const [userTeamId] = await connection.query('SELECT id FROM teams WHERE is_user_team = true');
      
      if (userTeamId.length === 0) {
        console.log("Nenhum time de usuário encontrado!");
        return;
      }
      
      const teamId = userTeamId[0].id;
      console.log(`Time do usuário: ID ${teamId}`);
      
      // 4. Atualizar partidas
      const [updateResult] = await connection.query(
        'UPDATE matches SET season_id = ? WHERE (home_team_id = ? OR away_team_id = ?)',
        [seasonId, teamId, teamId]
      );
      
      console.log(`${updateResult.affectedRows} partidas atualizadas com season_id = ${seasonId}`);
      
      console.log("Operação concluída com sucesso!");
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    pool.end();
  }
}

// Executar a função
updateMatchesSeasonId();