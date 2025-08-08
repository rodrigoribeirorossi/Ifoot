const fs = require('fs').promises;
const path = require('path');

/**
 * Inicializa uma temporada com dados pré-definidos a partir de um JSON
 * @param {Connection} connection - Conexão com o banco de dados
 * @param {number} userTeamId - ID do time do usuário
 * @returns {Promise<number>} - ID da temporada criada
 */
async function initializeFixedSeason(connection, userTeamId) {
  try {
    console.log(`Inicializando temporada fixa para o time ${userTeamId}`);

    // 1. Carregar dados da temporada a partir do arquivo JSON
    const seasonJsonPath = path.join(__dirname, 'data', 'season2024.json');
    console.log(`Carregando dados do arquivo ${seasonJsonPath}`);
    
    let seasonData;
    try {
      const jsonContent = await fs.readFile(seasonJsonPath, 'utf8');
      seasonData = JSON.parse(jsonContent);
      console.log('Arquivo JSON da temporada carregado com sucesso');
    } catch (fileError) {
      console.error('Erro ao carregar arquivo da temporada:', fileError);
      throw new Error(`Não foi possível carregar o arquivo da temporada: ${fileError.message}`);
    }

    // 2. Criar a temporada
    const [seasonResult] = await connection.query(
      'INSERT INTO seasons (year, is_current) VALUES (?, ?, ?)',
      [seasonData.seasonInfo.year, true]
    );
    
    const seasonId = seasonResult.insertId;
    console.log(`Temporada criada com ID ${seasonId}`);

    // 3. Buscar o nome do time do usuário
    const [userTeamResult] = await connection.query(
      'SELECT name FROM user_teams WHERE id = ?',
      [userTeamId]
    );
    
    if (userTeamResult.length === 0) {
      throw new Error(`Time com ID ${userTeamId} não encontrado`);
    }
    
    const userTeamName = userTeamResult[0].name;

    // 4. Criar competições
    for (const competition of seasonData.competitions) {
      // Pular Libertadores na primeira temporada
      if (competition.name === "Copa Libertadores") {
        console.log(`Pulando Libertadores para o time ${userTeamId} (primeira temporada)`);
        continue;
      }
      
      console.log(`Criando competição: ${competition.name}`);
      
      const [compResult] = await connection.query(
        `INSERT INTO competitions 
         (name, type, format, season_id, status, description, start_date, end_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          competition.name,
          competition.type,
          competition.format,
          seasonId,
          competition.status || 'active',
          competition.description || '',
          competition.startDate || null,
          competition.endDate || null
        ]
      );
      
      const competitionId = compResult.insertId;
      
      // 5. Registrar o time do usuário na competição
      await connection.query(
        'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
        [competitionId, userTeamId]
      );
      
      // 6. Criar times da competição
      if (competition.teams && competition.teams.length > 0) {
        for (const teamData of competition.teams) {
          // Pular o USER_TEAM, pois já registramos o time do usuário
          if (teamData.name === 'USER_TEAM') continue;
          
          // Verificar se o time já existe
          const [existingTeam] = await connection.query(
            'SELECT id FROM teams WHERE name = ?',
            [teamData.name]
          );
          
          let teamId;
          
          if (existingTeam.length > 0) {
            teamId = existingTeam[0].id;
          } else {
            const [teamResult] = await connection.query(
              'INSERT INTO teams (name, is_user_team) VALUES (?, false)',
              [teamData.name]
            );
            teamId = teamResult.insertId;
          }
          
          // Associar o time à competição
          await connection.query(
            'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
            [competitionId, teamId]
          );
        }
      }
      
      // 7. Criar partidas para a competição
      if (competition.matches && competition.matches.length > 0) {
        for (const matchData of competition.matches) {
          // Substituir USER_TEAM pelo time do usuário
          const homeTeamId = matchData.homeTeam === 'USER_TEAM' 
            ? userTeamId
            : await getTeamId(connection, matchData.homeTeam);
            
          const awayTeamId = matchData.awayTeam === 'USER_TEAM' 
            ? userTeamId
            : await getTeamId(connection, matchData.awayTeam);
          
          if (!homeTeamId || !awayTeamId) {
            console.warn(`Pulando partida devido a times não encontrados: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
            continue;
          }
          
          await connection.query(
            `INSERT INTO matches 
             (competition_id, home_team_id, away_team_id, match_date, match_time, 
              stage, round, status, season_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              competitionId,
              homeTeamId,
              awayTeamId,
              matchData.date,
              matchData.time,
              matchData.stage,
              matchData.round,
              matchData.status || 'scheduled',
              seasonId
            ]
          );
        }
      }
    }
    
    console.log(`Temporada fixa inicializada com sucesso para o time ${userTeamId}`);
    return seasonId;
  } catch (error) {
    console.error('Erro ao inicializar temporada fixa:', error);
    throw error;
  }
}

/**
 * Busca o ID de um time pelo nome
 * @param {Connection} connection - Conexão com o banco de dados
 * @param {string} teamName - Nome do time
 * @returns {Promise<number|null>} - ID do time ou null se não encontrado
 */
async function getTeamId(connection, teamName) {
  const [team] = await connection.query(
    'SELECT id FROM teams WHERE name = ?',
    [teamName]
  );
  
  if (team.length > 0) {
    return team[0].id;
  }
  
  // Se o time não existir, cria-o
  const [result] = await connection.query(
    'INSERT INTO teams (name, is_user_team) VALUES (?, false)',
    [teamName]
  );
  
  return result.insertId;
}

// Exportar a função para uso em outros arquivos
module.exports = { 
  initializeFixedSeason 
};