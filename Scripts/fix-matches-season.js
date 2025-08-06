const mysql = require('mysql2/promise');

async function fixMatchesSeasonId() {
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
      
      // 3. Verificar time do usuário
      const [userTeam] = await connection.query('SELECT id FROM teams WHERE is_user_team = true');
      
      if (userTeam.length === 0) {
        console.log("Time do usuário não encontrado!");
        return;
      }
      
      const teamId = userTeam[0].id;
      console.log(`Time do usuário: ID ${teamId}`);
      
      // 4. Atualizar season_id para todas as partidas do time do usuário
      const [updateResult] = await connection.query(
        'UPDATE matches SET season_id = ? WHERE (home_team_id = ? OR away_team_id = ?)',
        [seasonId, teamId, teamId]
      );
      
      console.log(`${updateResult.affectedRows} partidas atualizadas`);
      
      // 5. Verificar quantas partidas tem agora com o season_id definido
      const [updated] = await connection.query(
        `SELECT COUNT(*) as count FROM matches 
         WHERE season_id = ? AND (home_team_id = ? OR away_team_id = ?)`,
        [seasonId, teamId, teamId]
      );
      
      console.log(`Agora existem ${updated[0].count} partidas com season_id = ${seasonId}`);
      
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
fixMatchesSeasonId();