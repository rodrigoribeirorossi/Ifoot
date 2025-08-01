import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Defina os tipos para as rotas do navegador
type RootStackParamList = {
  Home: undefined;
  CompetitionDetail: { competitionId: number; teamId: number; competitionName: string };
  // Adicione outras rotas conforme necessário
};

// Corrija o tipo de navegação
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Competition = {
  id: number;
  name: string;
  type: 'estadual' | 'nacional' | 'copa' | 'continental' | 'mundial';
  season_id: number;
  format: 'league' | 'knockout' | 'group_knockout';
  status: 'upcoming' | 'active' | 'completed';
};

export default function CompetitionsScreen() {
  const route = useRoute();
  // Use o tipo correto de navegação
  const navigation = useNavigation<NavigationProp>();
  const { teamId, seasonId } = route.params as { teamId: number; seasonId: number };
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCompetitions();
  }, [seasonId]);
  
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/competitions?season_id=${seasonId}`);
      const data = await response.json();
      setCompetitions(data);
    } catch (error) {
      console.error('Erro ao buscar competições:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getCompetitionIcon = (type: string) => {
    switch (type) {
      case 'estadual': return '🏆';
      case 'nacional': return '🏅';
      case 'copa': return '🏆';
      case 'continental': return '🌎';
      case 'mundial': return '🌍';
      default: return '🏆';
    }
  };
  
  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'league': return 'Pontos Corridos';
      case 'knockout': return 'Mata-mata';
      case 'group_knockout': return 'Grupos + Mata-mata';
      default: return format;
    }
  };
  
  const getStatusBadge = (status: string) => {
    let color;
    let text;
    
    switch (status) {
      case 'upcoming':
        color = '#e3f2fd';
        text = 'Em breve';
        break;
      case 'active':
        color = '#e8f5e9';
        text = 'Em andamento';
        break;
      case 'completed':
        color = '#fff3e0';
        text = 'Concluído';
        break;
      default:
        color = '#f5f5f5';
        text = status;
    }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <Text style={styles.statusText}>{text}</Text>
      </View>
    );
  };
  
  const renderCompetitionItem = ({ item }: { item: Competition }) => (
    <TouchableOpacity 
      style={styles.competitionCard}
      onPress={() => navigation.navigate('CompetitionDetail', { 
        competitionId: item.id,
        teamId,
        competitionName: item.name // Adicione o nome para usar no título
      })}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.competitionIcon}>{getCompetitionIcon(item.type)}</Text>
      </View>
      
      <View style={styles.competitionInfo}>
        <Text style={styles.competitionName}>{item.name}</Text>
        <Text style={styles.competitionFormat}>{getFormatDescription(item.format)}</Text>
      </View>
      
      {getStatusBadge(item.status)}
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Competições</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Carregando competições...</Text>
        </View>
      ) : (
        <FlatList
          data={competitions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCompetitionItem}
        />
      )}
    </View>
  );
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
  competitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  competitionIcon: {
    fontSize: 24,
  },
  competitionInfo: {
    flex: 1,
  },
  competitionName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  competitionFormat: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});