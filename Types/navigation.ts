// Crie este arquivo com todas as definições de navegação
export type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
  LoadGame: undefined;
  ChooseTeam: { budget: number; difficulty: string };
  Teams: undefined;
  Players: undefined;
  Match: { 
    matchId: number; 
    homeTeamId: number; 
    awayTeamId: number; 
    homeTeamName: string; 
    awayTeamName: string; 
    competitionName?: string 
  };
  History: undefined;
  ChooseCoach: { teamId: number; budgetRemaining: number };
  SeasonIntro: { teamId: number };
  TeamManagement: { teamId: number };
  Calendar: { teamId: number; seasonId: number };
  Competitions: { teamId: number; seasonId: number };
  CompetitionDetail: { competitionId: number; teamId: number; competitionName?: string };
  GameCentral: { teamId: number };
};

// Você também pode definir um tipo de navegação reutilizável:
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;