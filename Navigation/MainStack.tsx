//Configuração de navegação: 
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../Screens/HomeScreen';
import TeamsScreen from '../Screens/TeamsScreen';
import PlayersScreen from '../Screens/PlayersScreen';
import MatchScreen from '../Screens/MatchScreen';
import HistoryScreen from '../Screens/HistoryScreen';
import NewGameScreen from '../Screens/NewGame';
import LoadGameScreen from '../Screens/LoadGame';
import ChooseTeamScreen from '../Screens/ChooseTeam';
import ChooseCoachScreen from '../Screens/ChooseCoachScreen';
import SeasonIntroScreen from '../Screens/SeasonIntroScreen';
import TeamManagementScreen from '../Screens/TeamManagementScreen'; // Esta será a próxima tela após as instruções
import CalendarScreen from '../Screens/CalendarScreen';
import CompetitionsScreen from '../Screens/CompetitionsScreen';
import CompetitionDetailScreen from '../Screens/CompetitionDetailScreen';
import GameCentralScreen from '../Screens/GameCentralScreen';

// Atualize a definição de tipos para incluir todos os parâmetros necessários
type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
  LoadGame: undefined;
  ChooseTeam: { budget: number; difficulty: string; teamName?: string };
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
  Calendar: { teamId: number; seasonId: number | null; hasActiveSeason?: boolean };
  Competitions: { teamId: number; seasonId: number | null; hasActiveSeason?: boolean };
  CompetitionDetail: { competitionId: number; teamId: number; competitionName?: string };
  GameCentral: { teamId: number };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'IFoot' }} 
      />
      <Stack.Screen name="NewGame" component={NewGameScreen} />
      <Stack.Screen name="LoadGame" component={LoadGameScreen} />
      <Stack.Screen name="ChooseTeam" component={ChooseTeamScreen} />
      <Stack.Screen name="Teams" component={TeamsScreen} />
      <Stack.Screen name="Players" component={PlayersScreen} />
      <Stack.Screen name="Match" component={MatchScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="ChooseCoach" component={ChooseCoachScreen} options={{ title: 'Escolha seu Técnico' }} />
      <Stack.Screen 
        name="SeasonIntro" 
        component={SeasonIntroScreen} 
        options={{ 
          title: 'Preparando sua Temporada',
          headerShown: false // Opcional: remover o cabeçalho para uma experiência mais imersiva
        }} 
      />
      <Stack.Screen 
        name="TeamManagement" 
        component={TeamManagementScreen} 
        options={{ title: 'Escalação e Tática' }} 
      />
      <Stack.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Competitions" 
        component={CompetitionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="CompetitionDetail" component={CompetitionDetailScreen} options={({ route }) => ({ title: route.params.competitionName || 'Competição' })} />
      <Stack.Screen name="GameCentral" component={GameCentralScreen} options={{ title: 'Central de Jogos' }} />
    </Stack.Navigator>
  );
}