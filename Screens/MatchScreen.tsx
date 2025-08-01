import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Definição dos tipos para navegação
type RootStackParamList = {
  Match: { 
    matchId: number; 
    homeTeamId: number; 
    awayTeamId: number; 
    homeTeamName: string; 
    awayTeamName: string; 
    competitionName?: string;
  };
  Calendar: { teamId: number; seasonId: number };
  TeamManagement: { teamId: number };
  // Outras rotas necessárias
};

type MatchScreenRouteProp = RouteProp<RootStackParamList, 'Match'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Tipagem para o resultado da partida
type MatchResult = {
  homeScore: number;
  awayScore: number;
};

export default function MatchScreen() {
  const route = useRoute<MatchScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  
  const { 
    matchId, 
    homeTeamId, 
    awayTeamId,
    homeTeamName,
    awayTeamName, 
    competitionName 
  } = route.params;
  
  const [matchData, setMatchData] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchEvents, setMatchEvents] = useState<string[]>([]);
  
  useEffect(() => {
    // Carregar detalhes da partida quando a tela for montada
    fetchMatchDetails();
  }, [matchId]);
  
  const fetchMatchDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/matches/${matchId}`);
      const data = await response.json();
      setMatchData(data);
    } catch (error) {
      console.error('Erro ao buscar detalhes da partida:', error);
    }
  };
  
  const simulateMatch = async () => {
    setIsSimulating(true);
    setMatchEvents([]);
    
    try {
      // Simular a partida com base na formação e táticas atuais
      const response = await fetch(`http://localhost:3001/api/matches/${matchId}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Enviar formação e táticas atuais do time
          userTactics: {
            formation: '4-4-2', // Obter isso do estado global ou props
            tactic: 'balanced',
            playStyle: 'short_pass'
          }
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Simular eventos de jogo para melhor experiência do usuário
        await simulateGameEvents(result.result.homeScore, result.result.awayScore);
        
        // Definir o resultado final
        setMatchResult(result.result);
      }
    } catch (error) {
      console.error('Erro ao simular partida:', error);
      alert('Ocorreu um erro ao simular a partida.');
    } finally {
      setIsSimulating(false);
    }
  };
  
  // Corrigir a função simulateGameEvents adicionando tipagens explícitas
  const simulateGameEvents = async (homeScore: number, awayScore: number): Promise<string[]> => {
    // Cria uma sequência de eventos para mostrar durante a "simulação"
    const totalEvents = Math.max(10, homeScore + awayScore * 2);
    const events: string[] = [];
    
    // Função para gerar evento aleatório
    const generateEvent = (minute: number): string => {
      const eventTypes = ['chance', 'shot', 'save', 'foul', 'card', 'goal'];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const isHome = Math.random() > 0.45; // Ligeira vantagem para o time da casa
      const team = isHome ? homeTeamName : awayTeamName;
      
      let text = '';
      switch (type) {
        case 'chance':
          text = `${minute}' Chance para ${team}`;
          break;
        case 'shot':
          text = `${minute}' Finalização de ${team}`;
          break;
        case 'save':
          text = `${minute}' Grande defesa do goleiro de ${isHome ? awayTeamName : homeTeamName}`;
          break;
        case 'foul':
          text = `${minute}' Falta cometida por ${team}`;
          break;
        case 'card':
          const cardType = Math.random() > 0.7 ? 'amarelo' : 'vermelho';
          text = `${minute}' Cartão ${cardType} para jogador de ${team}`;
          break;
        case 'goal':
          // Só adiciona gols de acordo com o resultado final
          const homeGoals = events.filter(e => e.includes(`GOL de ${homeTeamName}`)).length;
          const awayGoals = events.filter(e => e.includes(`GOL de ${awayTeamName}`)).length;
          
          if ((isHome && homeGoals < homeScore) || (!isHome && awayGoals < awayScore)) {
            text = `${minute}' GOL de ${team}! ${homeGoals + (isHome ? 1 : 0)}-${awayGoals + (!isHome ? 1 : 0)}`;
          } else {
            text = `${minute}' Finalização perigosa de ${team}`;
          }
          break;
      }
      
      return text;
    };
    
    // Gera eventos em ordem cronológica
    let previousMinute = 0;
    
    for (let i = 0; i < totalEvents; i++) {
      // Gera um minuto aleatório, sempre maior que o anterior
      const minute = previousMinute + Math.floor(Math.random() * 8) + 1;
      previousMinute = minute > 90 ? 90 : minute;
      
      const event = generateEvent(minute);
      events.push(event);
      
      // Mostra os eventos gradualmente para criar efeito de simulação
      setMatchEvents([...events]);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Espera 1.5 segundos
    }
    
    return events;
  };
  
  const goToCalendar = () => {
    // Buscar o ID da temporada atual e navegar para o calendário
    fetch(`http://localhost:3001/api/teams/${homeTeamId}/current-season`)
      .then(res => res.json())
      .then(data => {
        if (data.seasonId) {
          navigation.navigate('Calendar', { 
            teamId: homeTeamId, 
            seasonId: data.seasonId 
          });
        } else {
          alert('Não foi possível encontrar a temporada atual');
        }
      })
      .catch(error => {
        console.error('Erro ao buscar temporada atual:', error);
        navigation.navigate('TeamManagement', { teamId: homeTeamId });
      });
  };
  
  const goBackToTeam = () => {
    navigation.navigate('TeamManagement', { teamId: homeTeamId });
  };
  
  return (
    <View style={styles.container}>
      {/* Cabeçalho da partida */}
      <View style={styles.matchHeader}>
        <Text style={styles.competitionName}>{competitionName || 'Amistoso'}</Text>
        
        <View style={styles.teamsContainer}>
          <View style={styles.teamInfo}>
            <Image 
              source={{ uri: `http://localhost:3001/assets/logos/${homeTeamId}.png` }} 
              style={styles.teamLogo}
              defaultSource={require('../assets/default-team.png')}
            />
            <Text style={styles.teamName}>{homeTeamName}</Text>
          </View>
          
          <View style={styles.scoreContainer}>
            {matchResult ? (
              <Text style={styles.scoreText}>
                {matchResult.homeScore} - {matchResult.awayScore}
              </Text>
            ) : (
              <Text style={styles.vsText}>VS</Text>
            )}
          </View>
          
          <View style={styles.teamInfo}>
            <Image 
              source={{ uri: `http://localhost:3001/assets/logos/${awayTeamId}.png` }} 
              style={styles.teamLogo}
              defaultSource={require('../assets/default-team.png')}
            />
            <Text style={styles.teamName}>{awayTeamName}</Text>
          </View>
        </View>
      </View>
      
      {/* Eventos da partida */}
      <ScrollView style={styles.eventsContainer}>
        {isSimulating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4caf50" />
            <Text style={styles.loadingText}>Simulando partida...</Text>
          </View>
        )}
        
        {matchEvents.map((event, index) => (
          <Text key={index} style={styles.eventText}>{event}</Text>
        ))}
        
        {matchResult && matchEvents.length === 0 && (
          <Text style={styles.eventText}>Partida encerrada com o placar de {matchResult.homeScore} - {matchResult.awayScore}.</Text>
        )}
      </ScrollView>
      
      {/* Botões de ação */}
      <View style={styles.buttonsContainer}>
        {!matchResult && !isSimulating && (
          <TouchableOpacity style={styles.simulateButton} onPress={simulateMatch}>
            <Text style={styles.buttonText}>Simular Partida</Text>
          </TouchableOpacity>
        )}
        
        {matchResult && (
          <>
            <TouchableOpacity style={styles.calendarButton} onPress={goToCalendar}>
              <MaterialIcons name="calendar-today" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Ver Calendário</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.teamButton} onPress={goBackToTeam}>
              <MaterialIcons name="people" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Voltar ao Time</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  matchHeader: {
    backgroundColor: '#1a237e',
    padding: 20,
    alignItems: 'center',
  },
  competitionName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  teamInfo: {
    alignItems: 'center',
    width: '40%',
  },
  teamLogo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  teamName: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  scoreContainer: {
    width: '20%',
    alignItems: 'center',
  },
  scoreText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  vsText: {
    color: '#fff',
    fontSize: 20,
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
  },
  eventText: {
    fontSize: 14,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#4caf50',
    paddingLeft: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4caf50',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  simulateButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  calendarButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  teamButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: 6,
  },
});