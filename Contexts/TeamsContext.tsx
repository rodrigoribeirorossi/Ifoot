//Gerenciamento de estado dos times
import React, { createContext, useState } from 'react';
export const TeamsContext = createContext<{ teams: { id: number; name: string; players: any[] }[]; setTeams: React.Dispatch<React.SetStateAction<{ id: number; name: string; players: any[] }[]>> } | undefined>(undefined);

export function TeamsProvider({ children }) { const [teams, setTeams] = useState([ { id: 1, name: 'Time A', players: [] }, { id: 2, name: 'Time B', players: [] } ]);

return ( <TeamsContext.Provider value={{ teams, setTeams }}> {children} </TeamsContext.Provider> ); }