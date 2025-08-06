const mysql = require('mysql2/promise');

async function fixSeasonData() {
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
    console.log("Iniciando diagnóstico e correção de dados...");
    const connection = await pool.getConnection();
    
    try {
      // 1. Identificar temporada atual
      const [currentSeason] = await connection.query(
        'SELECT id FROM seasons WHERE is_current = true ORDER BY id DESC LIMIT 1'
      );
      
      if (currentSeason.length === 0) {
        console.log("Nenhuma temporada ativa encontrada!");
        return;
      }
      
      const seasonId = currentSeason[0].id;
      console.log(`Temporada atual: ID ${seasonId}`);
      
      // 2. Verificar competições nesta temporada
      const [competitions] = await connection.query(
        'SELECT id, name, status FROM competitions WHERE season_id = ?',
        [seasonId]
      );
      
      console.log(`Encontradas ${competitions.length} competições na temporada ${seasonId}`);
      
      if (competitions.length === 0) {
        console.log("Criando competições para a temporada...");
        await createDefaultCompetitions(connection, seasonId);
      } else {
        // Atualizar status das competições para 'active'
        await connection.query(
          'UPDATE competitions SET status = "active" WHERE season_id = ?',
          [seasonId]
        );
        console.log("Status das competições atualizado para 'active'");
      }
      
      // 3. Verificar time do usuário
      const [userTeam] = await connection.query(
        'SELECT id, name FROM teams WHERE is_user_team = true'
      );
      
      if (userTeam.length === 0) {
        console.log("Nenhum time de usuário encontrado!");
        return;
      }
      
      const teamId = userTeam[0].id;
      const teamName = userTeam[0].name;
      console.log(`Time do usuário: ${teamName} (ID: ${teamId})`);
      
      // 4. Verificar se o time está registrado nas competições
      const [competitionTeams] = await connection.query(
        'SELECT ct.competition_id, c.name FROM competition_teams ct JOIN competitions c ON ct.competition_id = c.id WHERE ct.team_id = ? AND c.season_id = ?',
        [teamId, seasonId]
      );
      
      console.log(`Time registrado em ${competitionTeams.length} competições na temporada atual`);
      
      // 5. Se não estiver registrado, registrar em todas as competições da temporada
      if (competitionTeams.length === 0) {
        console.log("Registrando time nas competições...");
        
        for (const comp of competitions) {
          await connection.query(
            'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
            [comp.id, teamId]
          );
          console.log(`Time registrado na competição ${comp.name}`);
        }
      }
      
      // 6. Limpar partidas existentes deste time
      const [deleteResult] = await connection.query(
        'DELETE FROM matches WHERE home_team_id = ? OR away_team_id = ?',
        [teamId, teamId]
      );
      
      console.log(`${deleteResult.affectedRows} partidas antigas removidas`);
      
      // 7. Gerar novas partidas
      console.log("Gerando novas partidas para o time...");
      
      // 7.1 Buscar novamente as competições após registro
      const [updatedComps] = await connection.query(
        `SELECT c.id, c.name, c.type, c.season_id
         FROM competitions c
         JOIN competition_teams ct ON c.id = ct.competition_id
         WHERE ct.team_id = ? AND c.season_id = ?`,
        [teamId, seasonId]
      );
      
      if (updatedComps.length === 0) {
        console.log("ERRO: Não foi possível encontrar competições para o time!");
        return;
      }
      
      console.log(`Gerando partidas para ${updatedComps.length} competições`);
      
      // 7.2 Para cada competição, gerar partidas
      for (const comp of updatedComps) {
        // Buscar outros times na competição
        const [otherTeams] = await connection.query(
          `SELECT t.id, t.name
           FROM teams t
           JOIN competition_teams ct ON t.id = ct.team_id
           WHERE ct.competition_id = ? 
           AND t.id != ? 
           AND t.is_user_team = false
           AND t.name NOT LIKE '%Histórico%'`,
          [comp.id, teamId]
        );
        
        if (otherTeams.length === 0) {
          console.log(`Nenhum outro time encontrado na competição ${comp.name}`);
          continue;
        }
        
        console.log(`Gerando partidas contra ${otherTeams.length} times na competição ${comp.name}`);
        
        // Criar partidas
        const matchValues = [];
        const year = 2024;
        let startMonth = 0;
        
        if (comp.type === 'nacional') startMonth = 3;
        else if (comp.type === 'continental') startMonth = 1;
        else if (comp.type === 'copa') startMonth = 2;
        
        otherTeams.forEach((team, index) => {
          // Jogo de ida
          const awayMatchDate = new Date(year, startMonth, 7 + (index * 2));
          const formattedAwayDate = awayMatchDate.toISOString().split('T')[0];
          
          matchValues.push([
            comp.id, comp.id, team.id, teamId, formattedAwayDate, '19:30:00', 'Fase Regular', 'scheduled', seasonId
          ]);
          
          // Jogo de volta
          const homeMatchDate = new Date(year, startMonth + 2, 7 + (index * 2));
          const formattedHomeDate = homeMatchDate.toISOString().split('T')[0];
          
          matchValues.push([
            comp.id, comp.id, teamId, team.id, formattedHomeDate, '19:30:00', 'Fase Regular', 'scheduled', seasonId
          ]);
        });
        
        // Inserir partidas
        if (matchValues.length > 0) {
          const query = `INSERT INTO matches 
            (competition_id, tournament_id, home_team_id, away_team_id, 
             match_date, match_time, stage, status, season_id) 
            VALUES ?`;
          
          await connection.query(query, [matchValues]);
          console.log(`${matchValues.length} partidas geradas na competição ${comp.name}`);
        }
      }
      
      // 8. Verificar partidas criadas
      const [matchCount] = await connection.query(
        'SELECT COUNT(*) as count FROM matches WHERE (home_team_id = ? OR away_team_id = ?) AND season_id = ?',
        [teamId, teamId, seasonId]
      );
      
      console.log(`Total de partidas geradas: ${matchCount[0].count}`);
      
      console.log("Diagnóstico e correção concluídos com sucesso!");
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    pool.end();
  }
}

// Função auxiliar para criar competições
async function createDefaultCompetitions(connection, seasonId) {
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
      [comp.name, comp.type, comp.format, seasonId, 'active']
    );
    console.log(`Competição ${comp.name} criada`);
  }
}

// Executar o script
fixSeasonData();