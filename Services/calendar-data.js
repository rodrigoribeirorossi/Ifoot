/**
 * Dados pré-definidos para o calendário de partidas de cada competição
 */

// Atualizar o paulistaoTemplate para 16 times (formato real)
const paulistaoTemplate = [
  // Fase de Grupos - Grupo A
  { round: "Grupo A", home: "TEAM_1", away: "TEAM_2", month: 1, day: 15 },
  { round: "Grupo A", home: "TEAM_3", away: "TEAM_4", month: 1, day: 15 },
  { round: "Grupo A", home: "TEAM_1", away: "TEAM_3", month: 1, day: 20 },
  { round: "Grupo A", home: "TEAM_2", away: "TEAM_4", month: 1, day: 20 },
  { round: "Grupo A", home: "TEAM_1", away: "TEAM_4", month: 1, day: 25 },
  { round: "Grupo A", home: "TEAM_2", away: "TEAM_3", month: 1, day: 25 },
  // Repita para os grupos B, C e D...

  // Fase de Grupos - Grupo B
  { round: "Grupo B", home: "TEAM_5", away: "TEAM_6", month: 1, day: 15 },
  { round: "Grupo B", home: "TEAM_7", away: "TEAM_8", month: 1, day: 15 },
  { round: "Grupo B", home: "TEAM_5", away: "TEAM_7", month: 1, day: 20 },
  { round: "Grupo B", home: "TEAM_6", away: "TEAM_8", month: 1, day: 20 },
  { round: "Grupo B", home: "TEAM_5", away: "TEAM_8", month: 1, day: 25 },
  { round: "Grupo B", home: "TEAM_6", away: "TEAM_7", month: 1, day: 25 },    
  // Fase de Grupos - Grupo C
  { round: "Grupo C", home: "TEAM_9", away: "TEAM_10", month: 1, day: 15 },
  { round: "Grupo C", home: "TEAM_11", away: "TEAM_12", month: 1, day: 15 },
  { round: "Grupo C", home: "TEAM_9", away: "TEAM_11", month: 1, day: 20 },
  { round: "Grupo C", home: "TEAM_10", away: "TEAM_12", month: 1, day: 20 },
  { round: "Grupo C", home: "TEAM_9", away: "TEAM_12", month: 1, day: 25 },
  { round: "Grupo C", home: "TEAM_10", away: "TEAM_11", month: 1, day: 25 },  
  // Fase de Grupos - Grupo D
  { round: "Grupo D", home: "TEAM_13", away: "TEAM_14", month: 1, day: 15 },
  { round: "Grupo D", home: "TEAM_15", away: "TEAM_16", month: 1, day: 15 },
  { round: "Grupo D", home: "TEAM_13", away: "TEAM_15", month: 1, day: 20 },
  { round: "Grupo D", home: "TEAM_14", away: "TEAM_16", month: 1, day: 20 },
  { round: "Grupo D", home: "TEAM_13", away: "TEAM_16", month: 1, day: 25 },
  { round: "Grupo D", home: "TEAM_14", away: "TEAM_15", month: 1, day: 25 },

  // Quartas de Final (definidas após fase de grupos)
  { round: "Quartas de Final", home: "GROUP_A_1", away: "GROUP_B_2", month: 2, day: 10 },
  { round: "Quartas de Final", home: "GROUP_B_1", away: "GROUP_A_2", month: 2, day: 10 },
  { round: "Quartas de Final", home: "GROUP_C_1", away: "GROUP_D_2", month: 2, day: 11 },
  { round: "Quartas de Final", home: "GROUP_D_1", away: "GROUP_C_2", month: 2, day: 11 },
  
  // Semifinais e Final (usar placeholders que serão substituídos após as quartas)
  { round: "Semifinal", home: "QF_WINNER_1", away: "QF_WINNER_2", month: 2, day: 24 },
  { round: "Semifinal", home: "QF_WINNER_3", away: "QF_WINNER_4", month: 2, day: 25 },
  { round: "Final", home: "SF_WINNER_1", away: "SF_WINNER_2", month: 3, day: 10 }
];

// Brasileirão com 20 times (turno e returno)
const brasileiraoTemplate = generateCompleteLeagueTemplate(20, 4, 15); // 20 times, início em abril

/**
 * Gera um template completo para competições no formato liga (turno e returno)
 */
function generateCompleteLeagueTemplate(teamCount, startMonth, startDay) {
  const matches = [];
  
  // Calcular número total de rodadas
  const totalRounds = (teamCount - 1) * 2; // Turno e returno
  
  // Usar algoritmo Round Robin para gerar jogos equilibrados
  for (let round = 1; round <= totalRounds / 2; round++) {
    // Para cada rodada no turno
    for (let i = 0; i < teamCount / 2; i++) {
      // Time 1 joga contra o último, time 2 contra o penúltimo, etc.
      const team1 = i + 1;
      const team2 = teamCount - i;
      
      // Alternar mando de campo para distribuir melhor os jogos
      const isHomeFirst = round % 2 === 1;
      
      const homeTeam = isHomeFirst ? `TEAM_${team1}` : `TEAM_${team2}`;
      const awayTeam = isHomeFirst ? `TEAM_${team2}` : `TEAM_${team1}`;
      
      // Calcular data (distribuir jogos ao longo dos meses)
      const month = startMonth + Math.floor((round - 1) / 4);
      const day = startDay + ((round - 1) % 4) * 7;
      
      matches.push({
        round: round,
        home: homeTeam,
        away: awayTeam,
        month,
        day
      });
    }
  }
  
  // Gerar returno invertendo mandos
  const firstHalfMatches = [...matches];
  for (const match of firstHalfMatches) {
    // Avançar 5 meses para o returno (normalmente há pausa entre turnos)
    const returnMonth = Math.min(12, match.month + 5);
    const returnDay = match.day;
    
    matches.push({
      round: match.round + (totalRounds / 2),
      home: match.away, // Inverter mando
      away: match.home, // Inverter mando
      month: returnMonth,
      day: returnDay
    });
  }
  
  return matches;
}

// Template para Copa do Brasil (simplificada para 32 times)
const copaBrasilTemplate = [
  // Oitavas de final (ida)
  { round: "Oitavas (ida)", home: "TEAM_1", away: "TEAM_16", month: 5, day: 1 },
  { round: "Oitavas (ida)", home: "TEAM_2", away: "TEAM_15", month: 5, day: 1 },
  { round: "Oitavas (ida)", home: "TEAM_3", away: "TEAM_14", month: 5, day: 2 },
  { round: "Oitavas (ida)", home: "TEAM_4", away: "TEAM_13", month: 5, day: 2 },
  { round: "Oitavas (ida)", home: "TEAM_5", away: "TEAM_12", month: 5, day: 3 },
  { round: "Oitavas (ida)", home: "TEAM_6", away: "TEAM_11", month: 5, day: 3 },
  { round: "Oitavas (ida)", home: "TEAM_7", away: "TEAM_10", month: 5, day: 4 },
  { round: "Oitavas (ida)", home: "TEAM_8", away: "TEAM_9", month: 5, day: 4 },
  
  // Oitavas de final (volta)
  { round: "Oitavas (volta)", home: "TEAM_16", away: "TEAM_1", month: 5, day: 8 },
  { round: "Oitavas (volta)", home: "TEAM_15", away: "TEAM_2", month: 5, day: 8 },
  { round: "Oitavas (volta)", home: "TEAM_14", away: "TEAM_3", month: 5, day: 9 },
  { round: "Oitavas (volta)", home: "TEAM_13", away: "TEAM_4", month: 5, day: 9 },
  { round: "Oitavas (volta)", home: "TEAM_12", away: "TEAM_5", month: 5, day: 10 },
  { round: "Oitavas (volta)", home: "TEAM_11", away: "TEAM_6", month: 5, day: 10 },
  { round: "Oitavas (volta)", home: "TEAM_10", away: "TEAM_7", month: 5, day: 11 },
  { round: "Oitavas (volta)", home: "TEAM_9", away: "TEAM_8", month: 5, day: 11 },
  
  // Quartas de final (ida e volta)
  { round: "Quartas (ida)", home: "WINNER_1", away: "WINNER_8", month: 6, day: 5 },
  { round: "Quartas (ida)", home: "WINNER_2", away: "WINNER_7", month: 6, day: 5 },
  { round: "Quartas (ida)", home: "WINNER_3", away: "WINNER_6", month: 6, day: 6 },
  { round: "Quartas (ida)", home: "WINNER_4", away: "WINNER_5", month: 6, day: 6 },
  { round: "Quartas (volta)", home: "WINNER_8", away: "WINNER_1", month: 6, day: 12 },
  { round: "Quartas (volta)", home: "WINNER_7", away: "WINNER_2", month: 6, day: 12 },
  { round: "Quartas (volta)", home: "WINNER_6", away: "WINNER_3", month: 6, day: 13 },
  { round: "Quartas (volta)", home: "WINNER_5", away: "WINNER_4", month: 6, day: 13 },
  
  // Semifinais (ida e volta)
  { round: "Semifinal (ida)", home: "SEMIFINAL_1", away: "SEMIFINAL_4", month: 7, day: 10 },
  { round: "Semifinal (ida)", home: "SEMIFINAL_2", away: "SEMIFINAL_3", month: 7, day: 11 },
  { round: "Semifinal (volta)", home: "SEMIFINAL_4", away: "SEMIFINAL_1", month: 7, day: 17 },
  { round: "Semifinal (volta)", home: "SEMIFINAL_3", away: "SEMIFINAL_2", month: 7, day: 18 },
  
  // Final (ida e volta)
  { round: "Final (ida)", home: "FINAL_1", away: "FINAL_2", month: 8, day: 4 },
  { round: "Final (volta)", home: "FINAL_2", away: "FINAL_1", month: 8, day: 11 }
];

// Template para Libertadores (8 grupos de 4 times)
const libertadoresTemplate = [
  // Fase de grupos - jogos de ida (6 rodadas por grupo)
  // Grupo A
  { round: "Grupo A - R1", home: "TEAM_1", away: "TEAM_2", month: 3, day: 5 },
  { round: "Grupo A - R1", home: "TEAM_3", away: "TEAM_4", month: 3, day: 5 },
  { round: "Grupo A - R2", home: "TEAM_1", away: "TEAM_3", month: 3, day: 19 },
  { round: "Grupo A - R2", home: "TEAM_2", away: "TEAM_4", month: 3, day: 19 },
  { round: "Grupo A - R3", home: "TEAM_1", away: "TEAM_4", month: 4, day: 2 },
  { round: "Grupo A - R3", home: "TEAM_2", away: "TEAM_3", month: 4, day: 2 },
  
  // Fase de grupos - jogos de volta
  { round: "Grupo A - R4", home: "TEAM_2", away: "TEAM_1", month: 4, day: 16 },
  { round: "Grupo A - R4", home: "TEAM_4", away: "TEAM_3", month: 4, day: 16 },
  { round: "Grupo A - R5", home: "TEAM_3", away: "TEAM_1", month: 4, day: 30 },
  { round: "Grupo A - R5", home: "TEAM_4", away: "TEAM_2", month: 4, day: 30 },
  { round: "Grupo A - R6", home: "TEAM_4", away: "TEAM_1", month: 5, day: 14 },
  { round: "Grupo A - R6", home: "TEAM_3", away: "TEAM_2", month: 5, day: 14 },
  
  // Fase eliminatória
  // Oitavas
  { round: "Oitavas (ida)", home: "GROUP_A_1", away: "GROUP_B_2", month: 7, day: 15 },
  { round: "Oitavas (ida)", home: "GROUP_C_1", away: "GROUP_D_2", month: 7, day: 16 },
  { round: "Oitavas (ida)", home: "GROUP_E_1", away: "GROUP_F_2", month: 7, day: 17 },
  { round: "Oitavas (ida)", home: "GROUP_G_1", away: "GROUP_H_2", month: 7, day: 18 },
  { round: "Oitavas (ida)", home: "GROUP_B_1", away: "GROUP_A_2", month: 7, day: 15 },
  { round: "Oitavas (ida)", home: "GROUP_D_1", away: "GROUP_C_2", month: 7, day: 16 },
  { round: "Oitavas (ida)", home: "GROUP_F_1", away: "GROUP_E_2", month: 7, day: 17 },
  { round: "Oitavas (ida)", home: "GROUP_H_1", away: "GROUP_G_2", month: 7, day: 18 },
  
  // Oitavas (volta)
  { round: "Oitavas (volta)", home: "GROUP_B_2", away: "GROUP_A_1", month: 7, day: 22 },
  { round: "Oitavas (volta)", home: "GROUP_D_2", away: "GROUP_C_1", month: 7, day: 23 },
  { round: "Oitavas (volta)", home: "GROUP_F_2", away: "GROUP_E_1", month: 7, day: 24 },
  { round: "Oitavas (volta)", home: "GROUP_H_2", away: "GROUP_G_1", month: 7, day: 25 },
  { round: "Oitavas (volta)", home: "GROUP_A_2", away: "GROUP_B_1", month: 7, day: 22 },
  { round: "Oitavas (volta)", home: "GROUP_C_2", away: "GROUP_D_1", month: 7, day: 23 },
  { round: "Oitavas (volta)", home: "GROUP_E_2", away: "GROUP_F_1", month: 7, day: 24 },
  { round: "Oitavas (volta)", home: "GROUP_G_2", away: "GROUP_H_1", month: 7, day: 25 },
  
  // Quartas, Semifinais e Final
  { round: "Quartas (ida)", home: "QUARTERS_1", away: "QUARTERS_2", month: 8, day: 13 },
  { round: "Quartas (volta)", home: "QUARTERS_2", away: "QUARTERS_1", month: 8, day: 20 },
  { round: "Semifinal (ida)", home: "SEMI_1", away: "SEMI_2", month: 9, day: 24 },
  { round: "Semifinal (volta)", home: "SEMI_2", away: "SEMI_1", month: 10, day: 1 },
  { round: "Final", home: "FINALIST_1", away: "FINALIST_2", month: 10, day: 30 }
];

// Template para Mundial de Clubes (formato simplificado)
const mundialTemplate = [
  // Fase de Grupos (apenas alguns jogos exemplo)
  { round: "Grupo A - R1", home: "TEAM_1", away: "TEAM_2", month: 11, day: 15 },
  { round: "Grupo A - R1", home: "TEAM_3", away: "TEAM_4", month: 11, day: 15 },
  { round: "Grupo A - R2", home: "TEAM_1", away: "TEAM_3", month: 11, day: 18 },
  { round: "Grupo A - R2", home: "TEAM_2", away: "TEAM_4", month: 11, day: 18 },
  { round: "Grupo A - R3", home: "TEAM_1", away: "TEAM_4", month: 11, day: 21 },
  { round: "Grupo A - R3", home: "TEAM_2", away: "TEAM_3", month: 11, day: 21 },
  
  // Fase Eliminatória
  { round: "Oitavas", home: "GROUP_A_1", away: "GROUP_B_2", month: 12, day: 3 },
  { round: "Oitavas", home: "GROUP_C_1", away: "GROUP_D_2", month: 12, day: 3 },
  { round: "Oitavas", home: "GROUP_E_1", away: "GROUP_F_2", month: 12, day: 4 },
  { round: "Oitavas", home: "GROUP_G_1", away: "GROUP_H_2", month: 12, day: 4 },
  { round: "Quartas", home: "WINNER_1", away: "WINNER_2", month: 12, day: 10 },
  { round: "Quartas", home: "WINNER_3", away: "WINNER_4", month: 12, day: 10 },
  { round: "Semifinal", home: "SEMI_1", away: "SEMI_2", month: 12, day: 15 },
  { round: "Final", home: "FINALIST_1", away: "FINALIST_2", month: 12, day: 20 }
];

module.exports = {
  paulistaoTemplate,
  brasileiraoTemplate,
  copaBrasilTemplate,
  libertadoresTemplate,
  mundialTemplate
};