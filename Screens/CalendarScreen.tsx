import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Match = {
  id: number;
  competition_id: number;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  competition_name: string;
  match_date: string;
  match_time: string;
  stage: string;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'live' | 'completed' | 'postponed';
};

type RootStackParamList = {
  Match: { 
    matchId: number; 
    homeTeamId: number; 
    awayTeamId: number; 
    homeTeamName: string; 
    awayTeamName: string; 
    competitionName?: string 
  };
  // Outras rotas se necessário
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CalendarScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { teamId, seasonId } = route.params as { teamId: number; seasonId: number };
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCalendar();
  }, [teamId, seasonId]);
  
  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/calendar/${teamId}?season_id=${seasonId}`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Erro ao buscar calendário:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };
  
  const groupMatchesByMonth = () => {
    const grouped = matches.reduce((acc, match) => {
      const date = new Date(match.match_date);
      const month = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      if (!acc[month]) {
        acc[month] = [];
      }
      
      acc[month].push(match);
      return acc;
    }, {} as Record<string, Match[]>);
    
    return Object.entries(grouped).map(([month, matches]) => ({
      month,
      matches
    }));
  };
  
  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity 
      style={styles.matchItem}
      onPress={() => navigation.navigate('Match', {
        matchId: item.id,
        homeTeamId: item.home_team_id,
        awayTeamId: item.away_team_id,
        homeTeamName: item.home_team_name,
        awayTeamName: item.away_team_name,
        competitionName: item.competition_name
      })}
    >
      <View style={styles.matchDate}>
        <Text style={styles.dateText}>{formatDate(item.match_date)}</Text>
        <Text style={styles.timeText}>{item.match_time.substring(0, 5)}</Text>
      </View>
      
      <View style={styles.matchInfo}>
        <View style={styles.teamsContainer}>
          <Text style={styles.teamName}>{item.home_team_name}</Text>
          <View style={styles.scoreContainer}>
            {item.status === 'completed' ? (
              <Text style={styles.scoreText}>{item.home_score} - {item.away_score}</Text>
            ) : (
              <Text style={styles.vsText}>vs</Text>
            )}
          </View>
          <Text style={styles.teamName}>{item.away_team_name}</Text>
        </View>
        
        <View style={styles.competitionContainer}>
          <Text style={styles.competitionText}>{item.competition_name}</Text>
          {item.stage && (
            <Text style={styles.stageText}>{item.stage}</Text>
          )}
        </View>
      </View>
      
      <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Calendário de Jogos</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Carregando calendário...</Text>
        </View>
      ) : (
        <FlatList
          data={groupMatchesByMonth()}
          keyExtractor={(item) => item.month}
          renderItem={({ item }) => (
            <View style={styles.monthSection}>
              <Text style={styles.monthHeader}>{item.month}</Text>
              <FlatList
                data={item.matches}
                keyExtractor={(match) => match.id.toString()}
                renderItem={renderMatchItem}
                scrollEnabled={false}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'scheduled': return styles.scheduledBadge;
    case 'live': return styles.liveBadge;
    case 'completed': return styles.completedBadge;
    case 'postponed': return styles.postponedBadge;
    default: return {};
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'scheduled': return 'Agendado';
    case 'live': return 'Ao vivo';
    case 'completed': return 'Encerrado';
    case 'postponed': return 'Adiado';
    default: return status;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchDate: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  matchInfo: {
    flex: 1,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreContainer: {
    marginHorizontal: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 12,
    color: '#666',
  },
  competitionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  competitionText: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
  },
  stageText: {
    fontSize: 11,
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  scheduledBadge: {
    backgroundColor: '#e3f2fd',
  },
  liveBadge: {
    backgroundColor: '#ffebee',
  },
  completedBadge: {
    backgroundColor: '#e8f5e9',
  },
  postponedBadge: {
    backgroundColor: '#fff3e0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});