//Função: Chama a função de simulação via contexto e exibe resultados.
import React from 'react';
import { useMatch } from '../Contexts/MatchContext';

export default function GameScreen() {
  const { playMatch, history } = useMatch();

  // Exemplo de uso:
  // const result = playMatch(homeTeam, awayTeam);

  return (
    // ...sua UI
  );
}