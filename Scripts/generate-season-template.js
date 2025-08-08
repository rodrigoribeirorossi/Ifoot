const fs = require('fs').promises;
const path = require('path');

async function generateSeasonTemplate() {
  const season = {
    seasonInfo: {
      year: 2024,
      name: "Temporada 2024"
    },
    competitions: [
      createPaulistao(),
      createBrasileirao(),
      createCopaDoBrasil(),
      createLibertadores()
    ]
  };

  const dirPath = path.join(__dirname, '..', 'Services', 'data');
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    // Ignora se o diretório já existe
  }
  
  const filePath = path.join(dirPath, 'season2024.json');
  await fs.writeFile(filePath, JSON.stringify(season, null, 2), 'utf8');
  
  console.log(`Template da temporada salvo em ${filePath}`);
}

// Função para criar o Paulistão com formato realista
function createPaulistao() {
  const competition = {
    id: 1,
    name: "Paulistão A1",
    type: "estadual",
    format: "group_knockout",
    status: "active",
    description: "Campeonato Paulista Série A1 2024",
    startDate: "2024-01-21",
    endDate: "2024-03-31",
    groups: [
      { name: "A", teams: ["USER_TEAM", "Corinthians", "Inter de Limeira", "Botafogo-SP"] },
      { name: "B", teams: ["Palmeiras", "Ponte Preta", "Água Santa", "Guarani"] },
      { name: "C", teams: ["São Paulo", "Mirassol", "São Bernardo", "Ituano"] },
      { name: "D", teams: ["Santos", "Red Bull Bragantino", "Novorizontino", "Portuguesa"] }
    ],
    teams: [
      { name: "USER_TEAM", isUserTeam: true, group: "A" },
      { name: "Corinthians", isUserTeam: false, group: "A" },
      { name: "Inter de Limeira", isUserTeam: false, group: "A" },
      { name: "Botafogo-SP", isUserTeam: false, group: "A" },
      { name: "Palmeiras", isUserTeam: false, group: "B" },
      { name: "Ponte Preta", isUserTeam: false, group: "B" },
      { name: "Água Santa", isUserTeam: false, group: "B" },
      { name: "Guarani", isUserTeam: false, group: "B" },
      { name: "São Paulo", isUserTeam: false, group: "C" },
      { name: "Mirassol", isUserTeam: false, group: "C" },
      { name: "São Bernardo", isUserTeam: false, group: "C" },
      { name: "Ituano", isUserTeam: false, group: "C" },
      { name: "Santos", isUserTeam: false, group: "D" },
      { name: "Red Bull Bragantino", isUserTeam: false, group: "D" },
      { name: "Novorizontino", isUserTeam: false, group: "D" },
      { name: "Portuguesa", isUserTeam: false, group: "D" }
    ],
    phases: [
      {
        name: "Fase de Grupos",
        type: "group",
        description: "Cada time joga contra todos do mesmo grupo em turno e returno"
      },
      {
        name: "Quartas de Final",
        type: "knockout",
        description: "Confrontos entre os dois primeiros de cada grupo"
      },
      {
        name: "Semifinal",
        type: "knockout",
        description: "Vencedores das quartas de final"
      },
      {
        name: "Final",
        type: "knockout",
        description: "Vencedores das semifinais"
      }
    ],
    matches: []
  };
  
  // Gerar apenas os jogos da fase de grupos para o time do usuário
  const userMatches = [];
  
  // Jogos contra times do mesmo grupo (ida e volta)
  const groupA = ["Corinthians", "Inter de Limeira", "Botafogo-SP"];
  const matchDates = [
    "2024-01-21", // 1ª rodada
    "2024-01-28", // 2ª rodada
    "2024-02-04", // 3ª rodada
    "2024-02-11", // 4ª rodada
    "2024-02-18", // 5ª rodada
    "2024-02-25"  // 6ª rodada
  ];
  
  // Jogos de ida (em casa)
  for (let i = 0; i < 3; i++) {
    userMatches.push({
      homeTeam: "USER_TEAM",
      awayTeam: groupA[i],
      date: matchDates[i],
      time: "19:00:00",
      stage: "Fase de Grupos",
      round: `${i+1}ª Rodada`,
      group: "A",
      status: "scheduled"
    });
  }
  
  // Jogos de volta (fora)
  for (let i = 0; i < 3; i++) {
    userMatches.push({
      homeTeam: groupA[i],
      awayTeam: "USER_TEAM",
      date: matchDates[i+3],
      time: "19:00:00",
      stage: "Fase de Grupos",
      round: `${i+4}ª Rodada`,
      group: "A",
      status: "scheduled"
    });
  }
  
  // IMPORTANTE: Para as fases eliminatórias, NÃO vamos predeterminar todos os jogos
  // Apenas indicamos que haverá um jogo nas quartas, usando placeholders
  // Quando o usuário terminar a fase de grupos, o sistema determinará dinamicamente seu adversário
  
  userMatches.push({
    homeTeam: "USER_TEAM", // Assumimos que o time do usuário se classificará
    awayTeam: "TBD_QUARTAS", // "To Be Determined" - A ser determinado após a fase de grupos
    date: "2024-03-13",
    time: "21:30:00",
    stage: "Quartas de Final",
    round: "Jogo Único",
    status: "scheduled",
    conditions: {
      depends_on: "group_position",
      rule: "O adversário será o 2º colocado do Grupo C se o USER_TEAM for 1º do Grupo A, ou o 1º do Grupo C se for 2º do Grupo A"
    }
  });
  
  competition.matches = userMatches;
  return competition;
}

// Função para criar o Brasileirão com formato realista
function createBrasileirao() {
  const competition = {
    id: 2,
    name: "Brasileirão Série A",
    type: "nacional",
    format: "league",
    status: "active",
    description: "Campeonato Brasileiro Série A 2024",
    startDate: "2024-04-14", 
    endDate: "2024-12-08",
    teams: [
      { name: "USER_TEAM", isUserTeam: true },
      { name: "Athletico-PR", isUserTeam: false },
      { name: "Atlético-GO", isUserTeam: false },
      { name: "Atlético-MG", isUserTeam: false },
      { name: "Bahia", isUserTeam: false },
      { name: "Botafogo", isUserTeam: false },
      { name: "Corinthians", isUserTeam: false },
      { name: "Criciúma", isUserTeam: false },
      { name: "Cruzeiro", isUserTeam: false },
      { name: "Cuiabá", isUserTeam: false },
      { name: "Flamengo", isUserTeam: false },
      { name: "Fluminense", isUserTeam: false },
      { name: "Fortaleza", isUserTeam: false },
      { name: "Grêmio", isUserTeam: false },
      { name: "Internacional", isUserTeam: false },
      { name: "Juventude", isUserTeam: false },
      { name: "Palmeiras", isUserTeam: false },
      { name: "Red Bull Bragantino", isUserTeam: false },
      { name: "São Paulo", isUserTeam: false },
      { name: "Vasco", isUserTeam: false }
    ],
    phases: [
      {
        name: "Fase Única",
        type: "league",
        description: "Todos contra todos em turno e returno"
      }
    ],
    matches: []
  };
  
  const opponents = competition.teams
                           .filter(team => !team.isUserTeam)
                           .map(team => team.name);
  
  const firstHalf = [];
  const secondHalf = [];
  
  // Datas reais do Brasileirão 2024
  const firstHalfDates = [
    "2024-04-14", "2024-04-21", "2024-04-28", "2024-05-05", 
    "2024-05-12", "2024-05-19", "2024-05-26", "2024-06-02", 
    "2024-06-12", "2024-06-16", "2024-06-23", "2024-06-30", 
    "2024-07-03", "2024-07-10", "2024-07-17", "2024-07-21", 
    "2024-07-28", "2024-08-04", "2024-08-11"
  ];
  
  const secondHalfDates = [
    "2024-08-18", "2024-08-25", "2024-09-01", "2024-09-15", 
    "2024-09-22", "2024-09-29", "2024-10-06", "2024-10-20", 
    "2024-10-27", "2024-11-03", "2024-11-10", "2024-11-17", 
    "2024-11-20", "2024-11-24", "2024-11-27", "2024-12-01", 
    "2024-12-04", "2024-12-08", "2024-12-08" // último dia tem rodada dupla
  ];
  
  // Primeiro turno - alternando jogos em casa e fora
  for (let i = 0; i < opponents.length; i++) {
    const isHome = i % 2 === 0;
    firstHalf.push({
      homeTeam: isHome ? "USER_TEAM" : opponents[i],
      awayTeam: isHome ? opponents[i] : "USER_TEAM",
      date: firstHalfDates[i],
      time: "16:00:00",
      stage: "Fase Única",
      round: `${i+1}ª Rodada`,
      status: "scheduled"
    });
  }
  
  // Segundo turno - invertendo os mandos de campo
  for (let i = 0; i < opponents.length; i++) {
    const isAway = i % 2 === 0; // Inverte em relação ao primeiro turno
    secondHalf.push({
      homeTeam: isAway ? "USER_TEAM" : opponents[i],
      awayTeam: isAway ? opponents[i] : "USER_TEAM",
      date: secondHalfDates[i],
      time: "16:00:00",
      stage: "Fase Única",
      round: `${i+20}ª Rodada`,
      status: "scheduled"
    });
  }
  
  competition.matches = [...firstHalf, ...secondHalf];
  return competition;
}

// Função para criar a Copa do Brasil com formato realista
function createCopaDoBrasil() {
  const competition = {
    id: 3,
    name: "Copa do Brasil",
    type: "copa",
    format: "knockout",
    status: "active",
    description: "Copa do Brasil 2024",
    startDate: "2024-02-21",
    endDate: "2024-11-10",
    teams: [
      { name: "USER_TEAM", isUserTeam: true },
      { name: "Flamengo", isUserTeam: false },
      { name: "São Paulo", isUserTeam: false },
      { name: "Palmeiras", isUserTeam: false },
      { name: "Atlético-MG", isUserTeam: false },
      { name: "Fluminense", isUserTeam: false },
      { name: "Corinthians", isUserTeam: false },
      { name: "Grêmio", isUserTeam: false },
      { name: "Athletico-PR", isUserTeam: false },
      { name: "Fortaleza", isUserTeam: false },
      { name: "Internacional", isUserTeam: false },
      { name: "Cruzeiro", isUserTeam: false },
      { name: "Bahia", isUserTeam: false },
      { name: "Botafogo", isUserTeam: false },
      { name: "Vasco", isUserTeam: false },
      { name: "Red Bull Bragantino", isUserTeam: false }
    ],
    phases: [
      {
        name: "Terceira Fase",
        type: "knockout",
        description: "32 times, jogos de ida e volta"
      },
      {
        name: "Oitavas de Final",
        type: "knockout",
        description: "16 times, jogos de ida e volta"
      },
      {
        name: "Quartas de Final",
        type: "knockout",
        description: "8 times, jogos de ida e volta"
      },
      {
        name: "Semifinal",
        type: "knockout",
        description: "4 times, jogos de ida e volta"
      },
      {
        name: "Final",
        type: "knockout",
        description: "2 times, jogos de ida e volta"
      }
    ],
    matches: []
  };
  
  // Para a Copa do Brasil, definimos apenas os confrontos iniciais
  // Os times do usuário entram na terceira fase
  const userMatches = [
    // Terceira fase - jogos de ida e volta
    {
      homeTeam: "USER_TEAM",
      awayTeam: "Vasco",
      date: "2024-05-01",
      time: "19:30:00",
      stage: "Terceira Fase",
      round: "Ida",
      status: "scheduled"
    },
    {
      homeTeam: "Vasco",
      awayTeam: "USER_TEAM",
      date: "2024-05-22",
      time: "19:30:00",
      stage: "Terceira Fase",
      round: "Volta",
      status: "scheduled"
    }
  ];
  
  // IMPORTANTE: Não predefinimos os confrontos das oitavas em diante
  // Eles serão determinados dinamicamente com base nos resultados anteriores
  
  competition.matches = userMatches;
  return competition;
}

// Função para criar a Libertadores com formato realista
function createLibertadores() {
  const competition = {
    id: 4,
    name: "Copa Libertadores",
    type: "continental",
    format: "group_knockout",
    status: "active",
    description: "Copa Libertadores da América 2024",
    startDate: "2024-04-03",
    endDate: "2024-11-30",
    groups: [
      { name: "E", teams: ["Flamengo", "Bolívar", "Palestino", "Talleres"] }
    ],
    teams: [
      { name: "Flamengo", isUserTeam: false, group: "E" },
      { name: "Bolívar", isUserTeam: false, group: "E" },
      { name: "Palestino", isUserTeam: false, group: "E" },
      { name: "Talleres", isUserTeam: false, group: "E" },
      { name: "Palmeiras", isUserTeam: false, group: "F" },
      { name: "Botafogo", isUserTeam: false, group: "D" },
      { name: "São Paulo", isUserTeam: false, group: "B" },
      { name: "Atlético-MG", isUserTeam: false, group: "G" },
      { name: "Fluminense", isUserTeam: false, group: "A" },
      { name: "Grêmio", isUserTeam: false, group: "C" }
    ],
    phases: [
      {
        name: "Fase de Grupos",
        type: "group",
        description: "32 times divididos em 8 grupos, jogos de ida e volta"
      },
      {
        name: "Oitavas de Final",
        type: "knockout",
        description: "16 times classificados, jogos de ida e volta"
      },
      {
        name: "Quartas de Final",
        type: "knockout",
        description: "8 times, jogos de ida e volta"
      },
      {
        name: "Semifinal",
        type: "knockout",
        description: "4 times, jogos de ida e volta"
      },
      {
        name: "Final",
        type: "knockout",
        description: "Final em jogo único"
      }
    ],
    matches: []
  };
  
  // Fase de grupos da Libertadores - datas reais de 2024
  const groupMatches = [
    // Jogos em casa
    {
      homeTeam: "USER_TEAM",
      awayTeam: "Flamengo",
      date: "2024-04-03",
      time: "21:30:00",
      stage: "Fase de Grupos",
      round: "1ª Rodada",
      group: "E",
      status: "scheduled"
    },
    {
      homeTeam: "USER_TEAM",
      awayTeam: "Bolívar",
      date: "2024-04-24",
      time: "21:30:00",
      stage: "Fase de Grupos",
      round: "3ª Rodada",
      group: "E",
      status: "scheduled"
    },
    {
      homeTeam: "USER_TEAM",
      awayTeam: "Palestino",
      date: "2024-05-15",
      time: "21:30:00",
      stage: "Fase de Grupos",
      round: "5ª Rodada",
      group: "E",
      status: "scheduled"
    },
    // Jogos fora
    {
      homeTeam: "Palestino",
      awayTeam: "USER_TEAM",
      date: "2024-04-10",
      time: "21:30:00",
      stage: "Fase de Grupos",
      round: "2ª Rodada",
      group: "E",
      status: "scheduled"
    },
    {
      homeTeam: "Bolívar",
      awayTeam: "USER_TEAM",
      date: "2024-05-08",
      time: "21:30:00",
      stage: "Fase de Grupos",
      round: "4ª Rodada",
      group: "E",
      status: "scheduled"
    },
    {
      homeTeam: "Flamengo",
      awayTeam: "USER_TEAM",
      date: "2024-05-29",
      time: "21:30:00",
      stage: "Fase de Grupos",
      round: "6ª Rodada",
      group: "E",
      status: "scheduled"
    }
  ];
  
  competition.matches = groupMatches;
  return competition;
}

// Executar a função
generateSeasonTemplate().catch(console.error);