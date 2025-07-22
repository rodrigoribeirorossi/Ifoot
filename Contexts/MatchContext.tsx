//Função: Gerencia o histórico de partidas, resultados e fornece funções para simular e registrar partidas.
import React, { createContext, useContext, useState } from 'react';
import { simulateMatch } from '../Utils/simulation';

const MatchContext = createContext(null);

export const MatchProvider = ({ children }) => {
  const [history, setHistory] = useState([]); // [{home, away, result, events}]

  const playMatch = (home, away) => {
    const result = simulateMatch(home, away);
    setHistory(prev => [
      ...prev,
      { home, away, result, events: result.events }
    ]);
    return result;
  };

  return (
    <MatchContext.Provider value={{ history, playMatch }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);