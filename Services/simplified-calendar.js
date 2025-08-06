/**
 * Versão ultra simplificada do gerenciador de calendário
 */
const mysql = require('mysql2/promise');

// Sincroniza competições com a tabela de torneios
async function syncTournaments(connection, seasonId) {
  try {
    console.log("Sincronizando competições com a tabela de torneios...");
    
    const [competitions] = await connection.query(
      'SELECT id, name FROM competitions WHERE season_id = ?',
      [seasonId]
    );
    
    for (const comp of competitions) {
      const [existingTournaments] = await connection.query(
        'SELECT id FROM tournaments WHERE id = ?',
        [comp.id]
      );
      
      if (existingTournaments.length === 0) {
        await connection.query(
          'INSERT INTO tournaments (id, name) VALUES (?, ?)',
          [comp.id, comp.name]
        );
        console.log(`Torneio criado para a competição ${comp.name} (ID: ${comp.id})`);
      }
    }
    
    console.log("Sincronização de torneios concluída");
    return true;
  } catch (error) {
    console.error("Erro ao sincronizar torneios:", error);
    throw error;
  }
}

// Gera partidas básicas para uma competição
async function generateBasicMatches(connection, competitionId, teamIds) {
  try {
    console.log(`Gerando partidas básicas para competição ID ${competitionId}`);

    // Data base para as partidas (começar em janeiro do próximo ano)
    const currentDate = new Date();
    const year = currentDate.getFullYear() + 1;
    let month = 0; // Janeiro
    
    // Determinar mês inicial baseado no tipo de competição
    const [competition] = await connection.query(
      'SELECT name FROM competitions WHERE id = ?',
      [competitionId]
    );
    
    if (competition.length > 0) {
      if (competition[0].name.includes('Brasileiro')) {
        month = 3; // Abril
      } else if (competition[0].name.includes('Libertadores')) {
        month = 1; // Fevereiro
      } else if (competition[0].name.includes('Mundial')) {
        month = 11; // Dezembro
      } else if (competition[0].name.includes('Copa')) {
        month = 2; // Março
      }
    }
    
    // Array para armazenar os valores das partidas
    const matchValues = [];
    
    // Gerar jogos de ida
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        // Calcular a data da partida (avançando alguns dias a cada jogo)
        const matchDate = new Date(year, month, 1 + (i * teamIds.length + j));
        
        // Formatar a data para o formato MySQL YYYY-MM-DD
        const formattedDate = matchDate.toISOString().split('T')[0];
        
        // Adicionar o jogo de ida
        matchValues.push([
          competitionId,       // competition_id
          competitionId,       // tournament_id (mesmo ID da competição)
          teamIds[i],          // home_team_id
          teamIds[j],          // away_team_id
          formattedDate,       // match_date
          '19:30:00',          // match_time
          'Primeira fase',     // stage
          'scheduled'          // status
        ]);
        
        // Adicionar o jogo de volta (1 mês depois)
        const returnMatchDate = new Date(year, month + 1, 1 + (i * teamIds.length + j));
        const formattedReturnDate = returnMatchDate.toISOString().split('T')[0];
        
        matchValues.push([
          competitionId,      // competition_id
          competitionId,      // tournament_id
          teamIds[j],         // home_team_id (invertido)
          teamIds[i],         // away_team_id (invertido)
          formattedReturnDate,// match_date
          '19:30:00',         // match_time
          'Primeira fase',    // stage
          'scheduled'         // status
        ]);
      }
    }
    
    // Inserir partidas no banco de dados
    if (matchValues.length > 0) {
      await connection.query(
        `INSERT INTO matches 
         (competition_id, tournament_id, home_team_id, away_team_id, match_date, match_time, stage, status) 
         VALUES ?`,
        [matchValues]
      );
      
      console.log(`${matchValues.length} partidas geradas para a competição ${competitionId}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao gerar partidas para competição ${competitionId}:`, error);
    throw error;
  }
}

// Substitua a função generateBasicCalendar por essa versão mais simples
async function generateBasicCalendar(connection, seasonId) {
  try {
    console.log("Gerando calendário básico para a temporada", seasonId);
    
    // 1. Buscar competições da temporada
    const [competitions] = await connection.query(
      'SELECT id FROM competitions WHERE season_id = ?',
      [seasonId]
    );
    
    // 2. Para cada competição, gerar um calendário básico
    for (const comp of competitions) {
      // 3. Obter times desta competição
      const [teams] = await connection.query(
        'SELECT team_id FROM competition_teams WHERE competition_id = ?',
        [comp.id]
      );
      
      if (teams.length < 2) {
        console.log(`Competição ${comp.id} tem menos de 2 times, pulando.`);
        continue;
      }
      
      // Extrair apenas os IDs dos times
      const teamIds = teams.map(t => t.team_id);
      
      // 4. Gerar partidas simples para esta competição
      await generateBasicMatches(connection, comp.id, teamIds);
    }
    
    console.log("Calendário básico gerado com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao gerar calendário básico:", error);
    throw error;
  }
}

/**
 * Gera partidas para o time do usuário em todas as competições que ele participa
 */
async function generateUserTeamMatches(connection, userTeamId) {
  try {
    console.log(`Gerando partidas para o time do usuário ID ${userTeamId}`);
    
    // 1. Buscar a temporada atual
    const [seasons] = await connection.query(
      'SELECT id FROM seasons WHERE is_current = true ORDER BY id DESC LIMIT 1'
    );
    
    if (seasons.length === 0) {
      console.error("Nenhuma temporada atual encontrada");
      return false;
    }
    
    const seasonId = seasons[0].id;
    console.log(`Temporada atual: ID ${seasonId}`);
    
    // 2. Buscar todas as competições da temporada atual
    const [competitions] = await connection.query(
      'SELECT id, name FROM competitions WHERE season_id = ?',
      [seasonId]
    );
    
    if (competitions.length === 0) {
      console.error(`Nenhuma competição encontrada para a temporada ${seasonId}`);
      return false;
    }
    
    console.log(`Encontradas ${competitions.length} competições na temporada ${seasonId}`);
    
    // 3. Para cada competição, verificar se o time está registrado
    let partidas = 0;
    for (const comp of competitions) {
      // Verificar se o time está na competição
      const [teamRegistration] = await connection.query(
        'SELECT * FROM competition_teams WHERE competition_id = ? AND team_id = ?',
        [comp.id, userTeamId]
      );
      
      if (teamRegistration.length === 0) {
        console.log(`Time ${userTeamId} não está registrado na competição ${comp.name}, registrando agora...`);
        
        // Registrar o time na competição
        await connection.query(
          'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
          [comp.id, userTeamId]
        );
      }
      
      console.log(`Gerando partidas para o time ${userTeamId} na competição ${comp.name}`);
      
      // 4. Buscar outros times nesta competição
      const [otherTeams] = await connection.query(
        `SELECT t.id, t.name
         FROM teams t
         JOIN competition_teams ct ON t.id = ct.team_id
         WHERE ct.competition_id = ? AND t.id != ? AND t.is_user_team = false
         LIMIT 10`,
        [comp.id, userTeamId]
      );
      
      if (otherTeams.length === 0) {
        console.warn(`Não há outros times na competição ${comp.name}`);
        
        // Buscar alguns times aleatórios e adicioná-los à competição
        const [randomTeams] = await connection.query(
          'SELECT id, name FROM teams WHERE is_user_team = false LIMIT 10'
        );
        
        for (const team of randomTeams) {
          await connection.query(
            'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
            [comp.id, team.id]
          );
          console.log(`Adicionado time ${team.name} à competição ${comp.name}`);
        }
        
        // Usar esses times
        otherTeams.push(...randomTeams);
      }
      
      // 5. Gerar partidas contra cada time
      const year = 2024;
      let month = 1; // Janeiro
      
      for (let i = 0; i < otherTeams.length; i++) {
        const team = otherTeams[i];
        
        // Partida em casa
        const homeDate = new Date(year, month + i, 10 + i);
        const formattedHomeDate = homeDate.toISOString().split('T')[0];
        
        await connection.query(
          `INSERT INTO matches 
           (competition_id, tournament_id, home_team_id, away_team_id, 
            match_date, match_time, stage, status, season_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [comp.id, comp.id, userTeamId, team.id, formattedHomeDate, '19:30:00', 
           'Fase Regular', 'scheduled', seasonId]
        );
        
        // Partida fora
        const awayDate = new Date(year, month + i + 3, 10 + i);
        const formattedAwayDate = awayDate.toISOString().split('T')[0];
        
        await connection.query(
          `INSERT INTO matches 
           (competition_id, tournament_id, home_team_id, away_team_id, 
            match_date, match_time, stage, status, season_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [comp.id, comp.id, team.id, userTeamId, formattedAwayDate, '19:30:00', 
           'Fase Regular', 'scheduled', seasonId]
        );
        
        partidas += 2;
      }
    }
    
    console.log(`Total de ${partidas} partidas geradas com sucesso para o time ${userTeamId}`);
    return true;
  } catch (error) {
    console.error(`Erro ao gerar partidas: ${error.message}`);
    throw error;
  }
}

// Não se esqueça de exportar a nova função
module.exports = { 
  syncTournaments, 
  generateBasicCalendar,
  generateBasicMatches,
  generateUserTeamMatches  // Adicione esta linha
};
