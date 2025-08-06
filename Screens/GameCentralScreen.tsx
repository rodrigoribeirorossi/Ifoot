import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { NavigationProp, RootStackParamList } from '../Types/navigation';
import { NextMatch } from '../Types/models'; 

export default function GameCentralScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { teamId } = route.params as { teamId: number };
  
  const [isLoading, setIsLoading] = useState(false);
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(null);
  const [hasActiveSeason, setHasActiveSeason] = useState(false);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  
  useEffect(() => {
    const checkForActiveSeasonAndPrompt = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/teams/${teamId}/current-season`);
        const data = await response.json();
        
        if (data.seasonId) {
          setCurrentSeasonId(data.seasonId);
          setHasActiveSeason(true);
          fetchNextMatch();
        } else {
          // Se não existe temporada, perguntar ao usuário se quer iniciar uma
          setTimeout(() => {
            Alert.alert(
              'Início de Temporada',
              'Para jogar, você precisa iniciar uma nova temporada. Deseja iniciar agora?',
              [
                {
                  text: 'Sim',
                  onPress: () => startSeason()
                },
                {
                  text: 'Não',
                  style: 'cancel',
                  onPress: () => console.log('Usuário optou por não iniciar temporada')
                }
              ],
              { cancelable: false }
            );
          }, 500);
        }
      } catch (error) {
        console.error('Erro ao verificar temporada ativa:', error);
      }
    };
    
    checkForActiveSeasonAndPrompt();
    fetchRecentMatches();
  }, [teamId]);
  
  const fetchNextMatch = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3001/api/matches/next/${teamId}`);
      const data = await response.json();
      setNextMatch(data);
    } catch (error) {
      console.error('Erro ao buscar próxima partida:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchRecentMatches = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/matches/recent/${teamId}?limit=5`);
      const data = await response.json();
      setRecentMatches(data);
    } catch (error) {
      console.error('Erro ao buscar partidas recentes:', error);
    }
  };
  
  const startSeason = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:3001/api/seasons/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: 2024, // Ano fixado em 2024 conforme regra
          user_team_id: teamId
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Sucesso', 'Temporada iniciada com sucesso!');
        setCurrentSeasonId(result.seasonId);
        setHasActiveSeason(true);
        fetchNextMatch(); // Atualiza com a próxima partida
      } else {
        Alert.alert('Erro', result.error || 'Erro ao iniciar temporada');
      }
    } catch (error) {
      console.error('Erro ao iniciar temporada:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao iniciar a temporada');
    } finally {
      setIsLoading(false);
    }
  };
  
  const goToMatch = () => {
    if (!nextMatch) return;
    
    navigation.navigate('Match', {
      matchId: nextMatch.id,
      homeTeamId: nextMatch.home_team_id,
      awayTeamId: nextMatch.away_team_id,
      homeTeamName: nextMatch.home_team_name,
      awayTeamName: nextMatch.away_team_name,
      competitionName: nextMatch.competition_name
    });
  };
  
  // Melhore a navegação para calendário:
  const viewCalendar = () => {
    if (!hasActiveSeason) {
      Alert.alert(
        'Temporada Necessária',
        'Você precisa iniciar uma temporada para ver o calendário.',
        [
          {
            text: 'Iniciar Temporada',
            onPress: () => startSeason()
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    
    if (currentSeasonId) {
      navigation.navigate('Calendar', { 
        teamId, 
        seasonId: currentSeasonId 
      });
    } else {
      Alert.alert('Erro', 'Não foi possível encontrar a temporada atual.');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Central de Jogo</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : (
        <>
          {/* Seção de Status da Temporada */}
          <View style={styles.seasonStatus}>
            {hasActiveSeason ? (
              <Text style={styles.statusText}>Temporada 2024 em andamento</Text>
            ) : (
              <View style={styles.noSeasonContainer}>
                <Text style={styles.noSeasonText}>Nenhuma temporada ativa</Text>
                <TouchableOpacity 
                  style={styles.startSeasonButton} 
                  onPress={startSeason}
                >
                  <Text style={styles.startSeasonButtonText}>Iniciar Temporada 2024</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Próxima Partida */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Próxima Partida</Text>
            {nextMatch ? (
              <View style={styles.matchCard}>
                <Text style={styles.matchDate}>
                  {formatDate(nextMatch.match_date)} • {nextMatch.competition_name}
                </Text>
                <View style={styles.teamsContainer}>
                  <Text style={styles.teamName}>{nextMatch.home_team_name}</Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={styles.teamName}>{nextMatch.away_team_name}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.playMatchButton} 
                  onPress={goToMatch}
                >
                  <MaterialIcons name="sports-soccer" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Jogar Partida</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.noMatchesText}>
                {hasActiveSeason 
                  ? "Não há partidas agendadas" 
                  : "Inicie uma temporada para ver suas partidas"}
              </Text>
            )}
          </View>
          
          {/* Ações rápidas */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={viewCalendar}
              disabled={!hasActiveSeason}
            >
              <MaterialIcons name="calendar-today" size={24} color="#1976d2" />
              <Text style={styles.actionButtonText}>Ver Calendário</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                // Verificar se o seasonId existe antes de navegar
                if (currentSeasonId) {
                  navigation.navigate('Competitions', { teamId, seasonId: currentSeasonId });
                } else {
                  Alert.alert('Temporada não iniciada', 'Inicie uma temporada para acessar as competições');
                }
              }}
              disabled={!hasActiveSeason}
            >
              <MaterialIcons name="emoji-events" size={24} color="#1976d2" />
              <Text style={styles.actionButtonText}>Competições</Text>
            </TouchableOpacity>
          </View>
          
          {/* Resultados Recentes */}
          {recentMatches.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Resultados Recentes</Text>
              {recentMatches.map((match) => (
                <View key={match.id} style={styles.recentMatchCard}>
                  <Text style={styles.recentMatchDate}>{formatDate(match.match_date)}</Text>
                  <View style={styles.recentMatchContent}>
                    <Text style={styles.recentTeamName}>{match.home_team_name}</Text>
                    <Text style={styles.recentScore}>{match.home_score} - {match.away_score}</Text>
                    <Text style={styles.recentTeamName}>{match.away_team_name}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a237e',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  seasonStatus: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4caf50',
    fontWeight: 'bold',
  },
  noSeasonContainer: {
    alignItems: 'center',
  },
  noSeasonText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#f57c00',
  },
  startSeasonButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
  },
  startSeasonButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  matchCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 10,
  },
  playMatchButton: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noMatchesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
    flex: 1,
  },
  actionButtonText: {
    marginTop: 5,
    color: '#1976d2',
  },
  recentMatchCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
    marginBottom: 5,
  },
  recentMatchDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  recentMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentTeamName: {
    fontSize: 14,
    flex: 1,
  },
  recentScore: {
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 10,
  },
});