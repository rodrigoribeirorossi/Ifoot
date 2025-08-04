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
    
    // 1. Buscar todas as competições que o time do usuário participa
    const [competitions] = await connection.query(
      `SELECT c.id, c.name, c.type 
       FROM competitions c
       JOIN competition_teams ct ON c.id = ct.competition_id
       WHERE ct.team_id = ?`,
      [userTeamId]
    );
    
    console.log(`Time participa de ${competitions.length} competições:`, competitions);
    
    if (competitions.length === 0) {
      console.log("Nenhuma competição encontrada para o time.");
      return false;
    }
    
    // 2. Para cada competição, gerar jogos contra outros times
    for (const comp of competitions) {
      // 2.1 Buscar outros times da competição (exceto o time do usuário)
      const [otherTeams] = await connection.query(
        `SELECT t.id, t.name
         FROM teams t
         JOIN competition_teams ct ON t.id = ct.team_id
         WHERE ct.competition_id = ? AND t.id != ?`,
        [comp.id, userTeamId]
      );
      
      if (otherTeams.length === 0) {
        console.log(`Nenhum outro time encontrado na competição ${comp.name}`);
        continue;
      }
      
      console.log(`Gerando partidas contra ${otherTeams.length} times na competição ${comp.name}`);
      
      // 2.2 Definir datas base para os jogos
      const currentDate = new Date();
      const year = currentDate.getFullYear() + 1; // Próximo ano
      let startMonth = 0; // Janeiro
      
      // Ajustar mês inicial baseado no tipo de competição
      if (comp.type === 'nacional') {
        startMonth = 3; // Abril
      } else if (comp.type === 'continental') {
        startMonth = 1; // Fevereiro
      } else if (comp.type === 'copa') {
        startMonth = 2; // Março
      }
      
      // 2.3 Criar partidas de ida e volta
      const matchValues = [];
      
      otherTeams.forEach((team, index) => {
        // Jogo de ida (visitante)
        const awayMatchDate = new Date(year, startMonth, 7 + (index * 2));
        const formattedAwayDate = awayMatchDate.toISOString().split('T')[0];
        
        matchValues.push([
          comp.id,             // competition_id
          comp.id,             // tournament_id
          team.id,             // home_team_id
          userTeamId,          // away_team_id
          formattedAwayDate,   // match_date
          '19:30:00',          // match_time
          'Fase Regular',      // stage
          'scheduled'          // status
        ]);
        
        // Jogo de volta (casa) - 2 meses depois
        const homeMatchDate = new Date(year, startMonth + 2, 7 + (index * 2));
        const formattedHomeDate = homeMatchDate.toISOString().split('T')[0];
        
        matchValues.push([
          comp.id,             // competition_id
          comp.id,             // tournament_id
          userTeamId,          // home_team_id
          team.id,             // away_team_id
          formattedHomeDate,   // match_date
          '19:30:00',          // match_time
          'Fase Regular',      // stage
          'scheduled'          // status
        ]);
      });
      
      // 2.4 Inserir as partidas no banco
      if (matchValues.length > 0) {
        await connection.query(
          `INSERT INTO matches 
           (competition_id, tournament_id, home_team_id, away_team_id, 
            match_date, match_time, stage, status) 
           VALUES ?`,
          [matchValues]
        );
        console.log(`${matchValues.length} partidas geradas para o time ${userTeamId} na competição ${comp.name}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao gerar partidas para o time ${userTeamId}:`, error);
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
