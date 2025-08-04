/**
 * Ferramenta para gerar templates de calendário 
 * Use isto para criar os dados no calendar-data.js
 */

function generateLeagueTemplate(teamCount) {
  const matches = [];
  const rounds = (teamCount - 1) * 2; // Turno e returno
  
  // Para cada time
  for (let home = 1; home <= teamCount; home++) {
    // Jogar contra todos os outros times (ida)
    for (let away = 1; away <= teamCount; away++) {
      if (home !== away) {
        // Calcular a rodada (algoritmo simples)
        let round = ((home + away) % (teamCount - 1)) + 1;
        if (away > home) round += teamCount - 1;
        
        // Calcular uma data aproximada
        const month = 1 + Math.floor((round - 1) / 4);
        const day = 1 + ((round - 1) % 4) * 7;
        
        matches.push({
          round,
          home: `TEAM_${home}`,
          away: `TEAM_${away}`,
          month,
          day
        });
        
        // Returno (invertendo mando de campo)
        round += teamCount - 1;
        const returnMonth = 1 + Math.floor((round - 1) / 4);
        const returnDay = 1 + ((round - 1) % 4) * 7;
        
        matches.push({
          round,
          home: `TEAM_${away}`,
          away: `TEAM_${home}`,
          month: returnMonth, 
          day: returnDay
        });
      }
    }
  }
  
  // Ordenar por rodada
  matches.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.month * 100 + a.day - (b.month * 100 + b.day);
  });
  
  return matches;
}

function generateKnockoutTemplate(teamCount) {
  const matches = [];
  let round = 1;
  let teamsInRound = teamCount;
  
  // Cada fase da copa
  while (teamsInRound > 1) {
    const matchesInRound = teamsInRound / 2;
    const roundName = getRoundName(matchesInRound);
    
    // Mês aumenta a cada fase
    const month = 2 + round;
    
    for (let i = 0; i < matchesInRound; i++) {
      // Dias diferentes dentro do mesmo mês
      const day = 5 + i * 2;
      
      matches.push({
        round: roundName,
        home: `TEAM_${i*2+1}`,
        away: `TEAM_${i*2+2}`,
        month,
        day
      });
    }
    
    teamsInRound = teamsInRound / 2;
    round++;
  }
  
  return matches;
}

function getRoundName(matchesInRound) {
  switch (matchesInRound) {
    case 1: return "Final";
    case 2: return "Semifinal";
    case 4: return "Quartas";
    case 8: return "Oitavas";
    case 16: return "16-avos";
    default: return `Fase ${matchesInRound}`;
  }
}

// Gerar e imprimir templates
console.log("PAULISTÃO TEMPLATE (10 times):");
console.log(JSON.stringify(generateLeagueTemplate(10), null, 2));

console.log("\nBRASILEIRÃO TEMPLATE (20 times):");
console.log(JSON.stringify(generateLeagueTemplate(20), null, 2));

console.log("\nCOPA DO BRASIL TEMPLATE (16 times):");
console.log(JSON.stringify(generateKnockoutTemplate(16), null, 2));