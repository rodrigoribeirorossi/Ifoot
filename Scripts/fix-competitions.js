const mysql = require('mysql2/promise');

async function fixCompetitionsAndSeasons() {
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
      // 1. Encontrar a temporada ativa atual
      const [currentSeason] = await connection.query(
        'SELECT id, year FROM seasons WHERE is_current = true'
      );
      
      if (currentSeason.length === 0) {
        console.log("Nenhuma temporada ativa encontrada!");
        return;
      }
      
      const seasonId = currentSeason[0].id;
      const seasonYear = currentSeason[0].year;
      
      console.log(`Temporada atual: ID ${seasonId}, Ano ${seasonYear}`);
      
      // 2. Verificar se existem competições para esta temporada
      const [competitions] = await connection.query(
        'SELECT COUNT(*) as count FROM competitions WHERE season_id = ?',
        [seasonId]
      );
      
      console.log(`${competitions[0].count} competições encontradas para temporada ${seasonId}`);
      
      // 3. Se não existirem competições, criar as padrão
      if (competitions[0].count === 0) {
        console.log("Criando competições padrão para a temporada ativa...");
        
        const defaultCompetitions = [
          { name: 'Paulistão A1', type: 'estadual', format: 'league' },
          { name: 'Brasileirão Série A', type: 'nacional', format: 'league' },
          { name: 'Copa do Brasil', type: 'copa', format: 'knockout' },
          { name: 'Copa Libertadores', type: 'continental', format: 'group_knockout' },
          { name: 'Mundial de Clubes', type: 'mundial', format: 'knockout' }
        ];
        
        for (const comp of defaultCompetitions) {
          await connection.query(
            'INSERT INTO competitions (name, type, format, season_id, status) VALUES (?, ?, ?, ?, ?)',
            [comp.name, comp.type, comp.format, seasonId, 'upcoming']
          );
        }
        
        console.log("Competições padrão criadas com sucesso!");
      }
      
      // 4. Verificar o time do usuário
      const [userTeam] = await connection.query(
        'SELECT id, name FROM teams WHERE is_user_team = true'
      );
      
      if (userTeam.length === 0) {
        console.log("Nenhum time de usuário encontrado!");
        return;
      }
      
      const teamId = userTeam[0].id;
      console.log(`Time do usuário: ${userTeam[0].name} (ID: ${teamId})`);
      
      // 5. Verificar se o time está registrado nas competições
      const [competitionTeams] = await connection.query(
        `SELECT ct.competition_id, c.name 
         FROM competition_teams ct
         JOIN competitions c ON ct.competition_id = c.id
         WHERE ct.team_id = ? AND c.season_id = ?`,
        [teamId, seasonId]
      );
      
      console.log(`Time registrado em ${competitionTeams.length} competições da temporada atual`);
      
      // 6. Registrar o time em todas as competições se necessário
      if (competitionTeams.length === 0) {
        console.log("Registrando time em todas as competições da temporada atual...");
        
        const [allCompetitions] = await connection.query(
          'SELECT id FROM competitions WHERE season_id = ?',
          [seasonId]
        );
        
        for (const comp of allCompetitions) {
          await connection.query(
            'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
            [comp.id, teamId]
          );
        }
        
        console.log(`Time registrado em ${allCompetitions.length} competições`);
      }
      
      console.log("Manutenção concluída com sucesso!");
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
fixCompetitionsAndSeasons();