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

type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
  LoadGame: undefined;
  Teams: undefined;
  Players: undefined;
  Match: undefined;
  History: undefined;
  ChooseTeam: undefined; // Adicionando a tela de escolha de time
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
    </Stack.Navigator>
  );
}