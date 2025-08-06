const mysql = require('mysql2/promise');
const { generateUserTeamMatches } = require('./simplified-calendar');

async function resetAndCreateMatches() {
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
      // 1. Buscar o time do usuário e sua temporada atual
      const [userTeam] = await connection.query(
        'SELECT id, name FROM user_teams WHERE id = 1'
      );
      
      if (userTeam.length === 0) {
        throw new Error("Time do usuário não encontrado!");
      }
      
      const teamId = userTeam[0].id;
      const teamName = userTeam[0].name;
      console.log(`Trabalhando com o time ${teamName} (ID: ${teamId})`);
      
      // 2. Buscar a temporada atual
      const [season] = await connection.query(
        'SELECT id FROM seasons WHERE is_current = true ORDER BY id DESC LIMIT 1'
      );
      
      if (season.length === 0) {
        throw new Error("Temporada ativa não encontrada!");
      }
      
      const seasonId = season[0].id;
      console.log(`Temporada atual: ID ${seasonId}`);
      
      // 3. Limpar todas as partidas existentes do time
      const [deleteResult] = await connection.query(
        'DELETE FROM matches WHERE home_team_id = ? OR away_team_id = ?',
        [teamId, teamId]
      );
      console.log(`${deleteResult.affectedRows} partidas antigas removidas`);
      
      // 4. Gerar novas partidas
      console.log("Gerando novas partidas...");
      await generateUserTeamMatches(connection, teamId);
      
      // 5. Verificar se as partidas foram criadas
      const [newMatches] = await connection.query(
        'SELECT COUNT(*) as count FROM matches WHERE (home_team_id = ? OR away_team_id = ?)',
        [teamId, teamId]
      );
      
      console.log(`${newMatches[0].count} novas partidas criadas para o time ${teamName}`);
      
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
resetAndCreateMatches();