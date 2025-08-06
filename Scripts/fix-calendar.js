const mysql = require('mysql2/promise');
const { generateUserTeamMatches } = require('./simplified-calendar');

async function fixCalendar() {
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
    console.log("Iniciando correção de calendário...");
    const connection = await pool.getConnection();
    
    try {
      // 1. Identificar a temporada atual
      const [currentSeason] = await connection.query(
        'SELECT id FROM seasons WHERE is_current = true ORDER BY id DESC LIMIT 1'
      );
      
      if (currentSeason.length === 0) {
        console.log("Nenhuma temporada ativa encontrada!");
        return;
      }
      
      const seasonId = currentSeason[0].id;
      console.log(`Temporada atual: ID ${seasonId}`);
      
      // 2. Identificar o time do usuário
      const [userTeam] = await connection.query(
        'SELECT id, name FROM teams WHERE is_user_team = true'
      );
      
      if (userTeam.length === 0) {
        console.log("Nenhum time de usuário encontrado!");
        return;
      }
      
      const teamId = userTeam[0].id;
      console.log(`Time do usuário: ${userTeam[0].name} (ID: ${teamId})`);
      
      // 3. Mostrar as competições da temporada atual
      const [competitions] = await connection.query(
        'SELECT id, name, type FROM competitions WHERE season_id = ?',
        [seasonId]
      );
      
      console.log(`Competições na temporada ${seasonId}:`);
      competitions.forEach(c => console.log(` - ${c.name} (ID: ${c.id}, Tipo: ${c.type})`));
      
      // 4. Registrar o time nas competições da temporada
      for (const comp of competitions) {
        if (comp.type === 'estadual' || comp.type === 'nacional' || comp.type === 'copa') {
          const [existingAssoc] = await connection.query(
            'SELECT * FROM competition_teams WHERE competition_id = ? AND team_id = ?',
            [comp.id, teamId]
          );
          
          if (existingAssoc.length === 0) {
            await connection.query(
              'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
              [comp.id, teamId]
            );
            console.log(`Time registrado na competição ${comp.name} (ID: ${comp.id})`);
          } else {
            console.log(`Time já estava registrado na competição ${comp.name} (ID: ${comp.id})`);
          }
        }
      }
      
      // 5. Limpar partidas antigas
      const [deleteResult] = await connection.query(
        'DELETE FROM matches WHERE home_team_id = ? OR away_team_id = ?',
        [teamId, teamId]
      );
      
      console.log(`${deleteResult.affectedRows} partidas antigas removidas`);
      
      // 6. Gerar novas partidas
      console.log("Gerando novas partidas...");
      await generateUserTeamMatches(connection, teamId);
      
      // 7. Verificar partidas geradas
      const [matches] = await connection.query(
        'SELECT COUNT(*) as count FROM matches WHERE (home_team_id = ? OR away_team_id = ?)',
        [teamId, teamId]
      );
      
      console.log(`Resultado: ${matches[0].count} partidas geradas`);
      
      console.log("Correção de calendário concluída!");
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    pool.end();
  }
}

fixCalendar().catch(console.error);