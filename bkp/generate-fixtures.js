const mysql = require('mysql2/promise');

async function generateFixturesForAllCompetitions() {
  try {
    // Configuração do banco de dados
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'AQWzsx2éàé(1)', // Sua senha
      database: 'ifoot',
      port: 3306,
    });
    
    console.log("Conexão com o banco de dados estabelecida!");
    
    // Obter todas as competições ativas
    const [competitions] = await connection.execute(
      'SELECT id, name, type, format FROM competitions WHERE status = "active"'
    );
    
    if (competitions.length === 0) {
      console.log("Não há competições ativas para gerar partidas.");
      await connection.end();
      return;
    }
    
    // Processar cada competição
    for (const competition of competitions) {
      try {
        console.log(`\nGerando jogos para ${competition.name}...`);
        
        // Obter times nesta competição
        const [teams] = await connection.execute(
          'SELECT t.* FROM teams t ' +
          'JOIN competition_teams ct ON t.id = ct.team_id ' +
          'WHERE ct.competition_id = ?',
          [competition.id]
        );
        
        if (teams.length < 2) {
          console.log(`Competição ${competition.name} não tem times suficientes para gerar jogos.`);
          continue;
        }
        
        console.log(`${teams.length} times encontrados para a competição.`);
        
        // Gerar partidas com base no formato da competição
        if (competition.format === 'league') {
          await generateLeagueFixtures(connection, competition.id, teams);
        } else if (competition.format === 'knockout') {
          await generateKnockoutFixtures(connection, competition.id, teams);
        } else if (competition.format === 'group_knockout') {
          await generateGroupKnockoutFixtures(connection, competition.id, teams);
        }
        
        console.log(`Partidas geradas para ${competition.name}!`);
        
        // Inicializar a tabela de classificação (standings)
        await initializeStandings(connection, competition.id, teams);
        console.log(`Tabela de classificação inicializada para ${competition.name}!`);
      } catch (error) {
        console.error(`Erro ao gerar partidas para ${competition.name}:`, error);
      }
    }
    
    // Fechar a conexão
    await connection.end();
    console.log("\nProcesso finalizado. Conexão fechada.");
    
  } catch (error) {
    console.error("Erro durante a execução:", error);
  }
}

// Gerar partidas para formato de liga (todos contra todos)
async function generateLeagueFixtures(connection, competitionId, teams) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // Primeira rodada começa em uma semana
  
  // Criar um array de partidas para inserção em lote
  const fixtures = [];
  
  // Turno
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const matchDate = new Date(startDate);
      matchDate.setDate(matchDate.getDate() + (i * teams.length + j) * 3); // 3 dias entre jogos
      
      fixtures.push([
        competitionId,
        teams[i].id,
        teams[j].id,
        formatDate(matchDate),
        formatTime(matchDate),
        'Rodada ' + Math.floor((i * teams.length + j) / (teams.length / 2) + 1),
        'scheduled'
      ]);
    }
  }
  
  // Returno (inverter mando de campo)
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const matchDate = new Date(startDate);
      const offset = teams.length * (teams.length - 1) / 2; // Total de jogos no turno
      matchDate.setDate(matchDate.getDate() + (offset + i * teams.length + j) * 3); // 3 dias entre jogos
      
      fixtures.push([
        competitionId,
        teams[j].id,
        teams[i].id,
        formatDate(matchDate),
        formatTime(matchDate),
        'Rodada ' + Math.floor((offset + i * teams.length + j) / (teams.length / 2) + 1),
        'scheduled'
      ]);
    }
  }
  
  // Inserir partidas no banco de dados
  if (fixtures.length > 0) {
    // Modificado para usar competition_id como tournament_id
    const values = fixtures.map(fixture => '(?, ?, ?, ?, ?, ?, ?)');
    const query = 'INSERT INTO matches (competition_id, tournament_id, home_team_id, away_team_id, match_date, match_time, stage, status) VALUES ' + 
      values.map(v => v.replace('(', '(?, ')).join(', ');
    
    const params = [];
    fixtures.forEach(fixture => {
      params.push(
        competitionId,  // Adiciona competitionId como tournament_id
        fixture.home_team_id,
        fixture.away_team_id,
        fixture.match_date,
        fixture.match_time,
        fixture.stage,
        'scheduled'
      );
    });
    
    await connection.query(query, params);
    console.log(`${fixtures.length} partidas geradas para o formato de liga.`);
  }
}

// Gerar partidas para formato mata-mata
async function generateKnockoutFixtures(connection, competitionId, teams) {
  // Embaralhar times para criar chaves aleatórias
  const shuffledTeams = shuffleArray([...teams]);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 14); // Primeira fase começa em duas semanas
  
  // Definir o número de times que será uma potência de 2
  const teamCount = getNextPowerOfTwo(shuffledTeams.length);
  const teamsToUse = shuffledTeams.slice(0, teamCount);
  
  // Criar os confrontos da primeira fase
  const fixtures = [];
  
  for (let i = 0; i < teamCount / 2; i++) {
    const homeTeam = teamsToUse[i];
    const awayTeam = teamsToUse[teamCount - 1 - i];
    
    const matchDate = new Date(startDate);
    matchDate.setDate(matchDate.getDate() + i * 2); // 2 dias entre jogos da mesma fase
    
    fixtures.push([
      competitionId,
      homeTeam.id,
      awayTeam.id,
      formatDate(matchDate),
      formatTime(matchDate),
      '1ª fase', // Fase (pode ser "Oitavas", "Quartas", etc.)
      'scheduled'
    ]);
  }
  
  // Inserir partidas no banco de dados
  if (fixtures.length > 0) {
    await connection.query(
      'INSERT INTO matches (competition_id, home_team_id, away_team_id, match_date, match_time, stage, status) VALUES ?',
      [fixtures]
    );
    console.log(`${fixtures.length} partidas geradas para o formato mata-mata.`);
  }
}

// Gerar partidas para formato de grupos + mata-mata (como a Libertadores)
async function generateGroupKnockoutFixtures(connection, competitionId, teams) {
  // Embaralhar times para criar grupos aleatórios
  const shuffledTeams = shuffleArray([...teams]);
  
  // Calcular número de grupos (4 times por grupo)
  const groupCount = Math.floor(shuffledTeams.length / 4);
  
  if (groupCount === 0) {
    console.log("Não há times suficientes para criar grupos.");
    return;
  }
  
  // Organizar times em grupos
  const groups = [];
  for (let i = 0; i < groupCount; i++) {
    groups.push(shuffledTeams.slice(i * 4, (i + 1) * 4));
  }
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // Fase de grupos começa em uma semana
  
  const fixtures = [];
  
  // Criar jogos para cada grupo (todos contra todos dentro do grupo)
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    const groupName = String.fromCharCode(65 + g); // A, B, C, etc.
    
    // Jogos dentro do grupo
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + (g * 6 + i * group.length + j) * 2); // 2 dias entre jogos
        
        fixtures.push([
          competitionId,
          group[i].id,
          group[j].id,
          formatDate(matchDate),
          formatTime(matchDate),
          `Grupo ${groupName}`,
          'scheduled'
        ]);
        
        // Jogo de volta
        const returnMatchDate = new Date(matchDate);
        returnMatchDate.setDate(returnMatchDate.getDate() + 14); // 14 dias depois
        
        fixtures.push([
          competitionId,
          group[j].id,
          group[i].id,
          formatDate(returnMatchDate),
          formatTime(returnMatchDate),
          `Grupo ${groupName}`,
          'scheduled'
        ]);
      }
    }
  }
  
  // Inserir partidas no banco de dados
  if (fixtures.length > 0) {
    await connection.query(
      'INSERT INTO matches (competition_id, home_team_id, away_team_id, match_date, match_time, stage, status) VALUES ?',
      [fixtures]
    );
    console.log(`${fixtures.length} partidas geradas para o formato de grupos + mata-mata.`);
  }
}

// Inicializar a tabela de classificação
async function initializeStandings(connection, competitionId, teams) {
  try {
    // Criar um array de registros para inserção em lote
    const standingsData = [];
    
    // Determinar se existem grupos para esta competição
    const [matches] = await connection.query(
      'SELECT DISTINCT stage FROM matches WHERE competition_id = ? AND stage LIKE ?',
      [competitionId, 'Grupo %']
    );
    
    // Se há grupos
    if (matches.length > 0) {
      // Obter todos os grupos
      const groups = matches.map(match => match.stage);
      
      // Obter times por grupo
      for (const group of groups) {
        const [groupTeams] = await connection.query(
          'SELECT DISTINCT home_team_id as team_id FROM matches ' +
          'WHERE competition_id = ? AND stage = ? ' +
          'UNION ' +
          'SELECT DISTINCT away_team_id as team_id FROM matches ' +
          'WHERE competition_id = ? AND stage = ?',
          [competitionId, group, competitionId, group]
        );
        
        // Para cada time no grupo, criar um registro na tabela standings
        for (let i = 0; i < groupTeams.length; i++) {
          standingsData.push([
            competitionId,
            groupTeams[i].team_id,
            i + 1, // position começa em 1
            0, // points
            0, // played
            0, // won
            0, // drawn
            0, // lost
            0, // goals_for
            0, // goals_against
            group, // group_name
          ]);
        }
      }
    } else {
      // Caso não tenha grupos (formato de liga regular)
      for (let i = 0; i < teams.length; i++) {
        standingsData.push([
          competitionId,
          teams[i].id,
          i + 1, // position começa em 1
          0, // points
          0, // played
          0, // won
          0, // drawn
          0, // lost
          0, // goals_for
          0, // goals_against
          null, // group_name (null para liga)
        ]);
      }
    }
    
    // Limpar standings anteriores para esta competição
    await connection.query('DELETE FROM standings WHERE competition_id = ?', [competitionId]);
    
    // Inserir registros de standings
    if (standingsData.length > 0) {
      await connection.query(
        'INSERT INTO standings (competition_id, team_id, position, points, played, won, drawn, lost, goals_for, goals_against, group_name) VALUES ?',
        [standingsData]
      );
      console.log(`${standingsData.length} registros de classificação inicializados.`);
    }
  } catch (error) {
    console.error('Erro ao inicializar standings:', error);
    throw error;
  }
}

// Funções auxiliares
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatTime(date) {
  return date.toTimeString().split(' ')[0].substring(0, 5) + ':00';
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getNextPowerOfTwo(n) {
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

// Exportar a função
module.exports = {
  generateFixturesForAllCompetitions,
  generateLeagueFixtures,
  generateKnockoutFixtures,
  generateGroupKnockoutFixtures,
  initializeStandings
};

// Se executado diretamente (não importado)
if (require.main === module) {
  generateFixturesForAllCompetitions()
    .catch(console.error);
}