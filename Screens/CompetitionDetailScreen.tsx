import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Match: { 
    matchId: number; 
    homeTeamId: number; 
    awayTeamId: number; 
    homeTeamName: string; 
    awayTeamName: string;
    competitionName?: string;
  };
  CompetitionDetail: { competitionId: number; teamId: number; competitionName: string };
  GameCentral: { teamId: number };
  // Outras rotas necessárias
};

type Team = {
  id: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
};

type Match = {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CompetitionDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { competitionId, teamId } = route.params as { competitionId: number; teamId: number; competitionName?: string };
  
  const [standings, setStandings] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'table' | 'matches'>('table');
  
  useEffect(() => {
    fetchCompetitionDetails();
  }, [competitionId]);
  
  const fetchCompetitionDetails = async () => {
    setLoading(true);
    try {
      // Buscar classificação
      const standingsResponse = await fetch(
        `http://localhost:3001/api/competitions/${competitionId}/standings`
      );
      const standingsData = await standingsResponse.json();
      
      // Buscar partidas
      const matchesResponse = await fetch(
        `http://localhost:3001/api/competitions/${competitionId}/matches?team_id=${teamId}`
      );
      const matchesData = await matchesResponse.json();
      
      setStandings(standingsData);
      setMatches(matchesData);
    } catch (error) {
      console.error('Erro ao buscar detalhes da competição:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Time</Text>
      <Text style={styles.tableHeaderCell}>J</Text>
      <Text style={styles.tableHeaderCell}>V</Text>
      <Text style={styles.tableHeaderCell}>E</Text>
      <Text style={styles.tableHeaderCell}>D</Text>
      <Text style={styles.tableHeaderCell}>GP</Text>
      <Text style={styles.tableHeaderCell}>GC</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Pts</Text>
    </View>
  );
  
  const renderTableRow = ({ item, index }: { item: Team; index: number }) => (
    <View style={[
      styles.tableRow, 
      index % 2 === 0 ? styles.evenRow : styles.oddRow,
      item.id === teamId ? styles.userTeamRow : null
    ]}>
      <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.tableCell}>{item.played}</Text>
      <Text style={styles.tableCell}>{item.won}</Text>
      <Text style={styles.tableCell}>{item.drawn}</Text>
      <Text style={styles.tableCell}>{item.lost}</Text>
      <Text style={styles.tableCell}>{item.goals_for}</Text>
      <Text style={styles.tableCell}>{item.goals_against}</Text>
      <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold' }]}>{item.points}</Text>
    </View>
  );
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };
  
  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity 
      style={styles.matchItem}
      onPress={() => {
        if (item.status === 'scheduled') {
          navigation.navigate('Match', { 
            matchId: item.id,
            homeTeamId: item.home_team_id,
            awayTeamId: item.away_team_id,
            homeTeamName: item.home_team_name,
            awayTeamName: item.away_team_name
          });
        }
      }}
    >
      <Text style={styles.matchDate}>{formatDate(item.match_date)}</Text>
      
      <View style={styles.matchTeams}>
        <Text style={[
          styles.matchTeamName, 
          item.home_team_id === teamId ? styles.userTeamText : null
        ]}>
          {item.home_team_name}
        </Text>
        
        <View style={styles.matchScore}>
          {item.status === 'completed' ? (
            <Text style={styles.scoreText}>{item.home_score} - {item.away_score}</Text>
          ) : (
            <Text style={styles.vsText}>VS</Text>
          )}
        </View>
        
        <Text style={[
          styles.matchTeamName, 
          item.away_team_id === teamId ? styles.userTeamText : null
        ]}>
          {item.away_team_name}
        </Text>
      </View>
      
      <View style={[styles.matchStatus, getStatusStyle(item.status)]}>
        <Text style={styles.matchStatusText}>{getStatusText(item.status)}</Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      {/* Tabs de navegação */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'table' ? styles.activeTab : null]}
          onPress={() => setActiveTab('table')}
        >
          <Text style={[styles.tabText, activeTab === 'table' ? styles.activeTabText : null]}>
            Classificação
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' ? styles.activeTab : null]}
          onPress={() => setActiveTab('matches')}
        >
          <Text style={[styles.tabText, activeTab === 'matches' ? styles.activeTabText : null]}>
            Partidas
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Carregando dados...</Text>
        </View>
      ) : activeTab === 'table' ? (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={standings}
            keyExtractor={item => item.id.toString()}
            renderItem={renderTableRow}
          />
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => item.id.toString()}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.matchesList}
        />
      )}
    </View>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'scheduled': return styles.scheduledStatus;
    case 'completed': return styles.completedStatus;
    case 'live': return styles.liveStatus;
    default: return styles.scheduledStatus;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'scheduled': return 'Agendado';
    case 'completed': return 'Finalizado';
    case 'live': return 'Ao vivo';
    default: return status;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  evenRow: {
    backgroundColor: '#ffffff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  userTeamRow: {
    backgroundColor: '#e3f2fd',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
  },
  matchesList: {
    padding: 12,
  },
  matchItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  matchDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchTeamName: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
  },
  userTeamText: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  matchScore: {
    flex: 1,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 12,
    color: '#666',
  },
  matchStatus: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scheduledStatus: {
    backgroundColor: '#e3f2fd',
  },
  completedStatus: {
    backgroundColor: '#e8f5e9',
  },
  liveStatus: {
    backgroundColor: '#ffebee',
  },
  matchStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});