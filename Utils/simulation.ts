//para calcular resultados baseados em estatísticas
type Player = {
  id: string;
  name: string;
  overall: number;
  position: string;
};

type Team = {
  id: string;
  name: string;
  players: Player[];
  homeAdvantage?: number;
  lastMatches?: { goalsFor: number; goalsAgainst: number; result: 'win'|'draw'|'loss' }[]; // últimos 5 jogos
};

type MatchResult = {
  homeGoals: number;
  awayGoals: number;
  events: string[];
};

function getFormBonus(lastMatches?: Team['lastMatches']) {
  if (!lastMatches || lastMatches.length === 0) return 0;
  // Exemplo: +2% por vitória, -2% por derrota nos últimos 5 jogos
  let bonus = 0;
  lastMatches.slice(-5).forEach(m => {
    if (m.result === 'win') bonus += 0.02;
    if (m.result === 'loss') bonus -= 0.02;
  });
  return bonus;
}

export function simulateMatch(home: Team, away: Team): MatchResult {
  const avg = (players: Player[]) =>
    players.slice(0, 11).reduce((sum, p) => sum + p.overall, 0) / 11;

  let homeOverall = avg(home.players);
  let awayOverall = avg(away.players);

  // Fator casa
  const homeAdv = home.homeAdvantage ?? 0.05;
  homeOverall *= 1 + homeAdv;

  // Fator forma recente
  homeOverall *= 1 + getFormBonus(home.lastMatches);
  awayOverall *= 1 + getFormBonus(away.lastMatches);

  // Fator sorte
  const luck = () => (Math.random() - 0.5) * 0.1;
  homeOverall *= 1 + luck();
  awayOverall *= 1 + luck();

  // Gols
  const baseGoals = (overall: number) =>
    Math.max(0, Math.round(((overall - 60) / 10) + Math.random() * 2));

  const homeGoals = baseGoals(homeOverall);
  const awayGoals = baseGoals(awayOverall);

  // Eventos
  const events: string[] = [];
  for (let i = 0; i < homeGoals; i++) {
    const scorer = home.players[Math.floor(Math.random() * 11)];
    events.push(`${scorer.name} marcou para ${home.name}`);
  }
  for (let i = 0; i < awayGoals; i++) {
    const scorer = away.players[Math.floor(Math.random() * 11)];
    events.push(`${scorer.name} marcou para ${away.name}`);
  }

  return { homeGoals, awayGoals, events };
}