//Tipos TypeScript:
ts export interface Player { id: number; name: string; position: string; stats: { speed: number; shooting: number; passing: number; }; }
export interface Team { id: number; name: string; players: Player[]; }