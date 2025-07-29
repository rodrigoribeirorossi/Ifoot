import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
//import DraggableFlatList from 'react-native-draggable-flatlist';

type Player = {
  id: number;
  name: string;
  position: string;
  overall: number;
  photo_url: string;
  energy: number; // 0-100
  isInjured: boolean;
  isSuspended: boolean;
};

type FormationType = {
  name: string;
  value: string;
  positions: { x: number; y: number; role: string }[];
};

type TacticType = 'defensive' | 'balanced' | 'offensive' | 'counter' | 'possession';
type PlayStyle = 'short_pass' | 'long_ball' | 'wings' | 'central';

export default function TeamManagementScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { teamId } = route.params as { teamId: number };
  
  const [loadingData, setLoadingData] = useState(true);
  const [starters, setStarters] = useState<Player[]>([]);
  const [reserves, setReserves] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [teamName, setTeamName] = useState('Meu Time');
  
  // Formações disponíveis
  const formations: FormationType[] = [
    {
      name: '4-4-2',
      value: '442',
      positions: [
        { x: 125, y: 340, role: 'GK' }, // Goleiro
        { x: 50, y: 280, role: 'LB' }, // Lateral Esquerdo
        { x: 90, y: 280, role: 'CB' }, // Zagueiro Esquerdo
        { x: 160, y: 280, role: 'CB' }, // Zagueiro Direito
        { x: 200, y: 280, role: 'RB' }, // Lateral Direito
        { x: 50, y: 200, role: 'LM' }, // Meia Esquerda
        { x: 90, y: 180, role: 'CM' }, // Volante Esquerdo
        { x: 160, y: 180, role: 'CM' }, // Volante Direito
        { x: 200, y: 200, role: 'RM' }, // Meia Direita
        { x: 90, y: 90, role: 'ST' }, // Atacante Esquerdo
        { x: 160, y: 90, role: 'ST' }, // Atacante Direito
      ]
    },
    {
      name: '4-3-3',
      value: '433',
      positions: [
        { x: 125, y: 340, role: 'GK' }, // Goleiro
        { x: 50, y: 280, role: 'LB' }, // Lateral Esquerdo
        { x: 90, y: 280, role: 'CB' }, // Zagueiro Esquerdo
        { x: 160, y: 280, role: 'CB' }, // Zagueiro Direito
        { x: 200, y: 280, role: 'RB' }, // Lateral Direito
        { x: 90, y: 200, role: 'CM' }, // Volante Esquerdo
        { x: 125, y: 180, role: 'CDM' }, // Volante Central
        { x: 160, y: 200, role: 'CM' }, // Volante Direito
        { x: 50, y: 90, role: 'LW' }, // Ponta Esquerda
        { x: 125, y: 90, role: 'ST' }, // Atacante Central
        { x: 200, y: 90, role: 'RW' }, // Ponta Direita
      ]
    },
    {
      name: '4-2-3-1',
      value: '4231',
      positions: [
        { x: 125, y: 340, role: 'GK' }, // Goleiro
        { x: 50, y: 280, role: 'LB' }, // Lateral Esquerdo
        { x: 90, y: 280, role: 'CB' }, // Zagueiro Esquerdo
        { x: 160, y: 280, role: 'CB' }, // Zagueiro Direito
        { x: 200, y: 280, role: 'RB' }, // Lateral Direito
        { x: 90, y: 220, role: 'CDM' }, // Volante Esquerdo
        { x: 160, y: 220, role: 'CDM' }, // Volante Direito
        { x: 50, y: 150, role: 'CAM' }, // Meia Esquerda
        { x: 125, y: 150, role: 'CAM' }, // Meia Central
        { x: 200, y: 150, role: 'CAM' }, // Meia Direita
        { x: 125, y: 80, role: 'ST' }, // Atacante Central
      ]
    },
  ];
  
  const [currentFormation, setCurrentFormation] = useState(formations[0]);
  const [tactic, setTactic] = useState<TacticType>('balanced');
  const [playStyle, setPlayStyle] = useState<PlayStyle>('short_pass');
  const [captain, setCaptain] = useState<number | null>(null);
  const [penaltyTaker, setPenaltyTaker] = useState<number | null>(null);
  const [freeKickTaker, setFreeKickTaker] = useState<number | null>(null);
  const [cornerTaker, setCornerTaker] = useState<number | null>(null);
  
  // Simulação de carregamento de dados do time
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Simular resposta da API - em produção, substitua por chamada real
        setTeamName('Lendas FC');
        
        // Simular jogadores titulares e reservas
        const mockStarters = Array(11).fill(null).map((_, index) => ({
          id: index + 1,
          name: `Titular ${index + 1}`,
          position: getPositionFromIndex(index),
          overall: Math.floor(Math.random() * 15) + 75, // 75-90
          photo_url: 'https://example.com/default-player.png',
          energy: Math.floor(Math.random() * 30) + 70, // 70-100
          isInjured: false,
          isSuspended: false,
        }));
        
        const mockReserves = Array(12).fill(null).map((_, index) => ({
          id: index + 12,
          name: `Reserva ${index + 1}`,
          position: getPositionFromIndex(Math.floor(Math.random() * 11)),
          overall: Math.floor(Math.random() * 10) + 70, // 70-80
          photo_url: 'https://example.com/default-player.png',
          energy: Math.floor(Math.random() * 30) + 70, // 70-100
          isInjured: index === 3, // Simular um jogador lesionado
          isSuspended: index === 5, // Simular um jogador suspenso
        }));
        
        setStarters(mockStarters);
        setReserves(mockReserves);
        
        // Definir capitão por padrão
        setCaptain(1);
        setPenaltyTaker(10);
        setFreeKickTaker(8);
        setCornerTaker(6);
        
        setLoadingData(false);
      } catch (error) {
        console.error("Erro ao carregar dados do time:", error);
      }
    };
    
    fetchTeamData();
  }, []);
  
  const handleFormationChange = (formationValue: string) => {
    const newFormation = formations.find(f => f.value === formationValue) || formations[0];
    setCurrentFormation(newFormation);
  };
  
  const handlePlayerSwap = (starterIndex: number, reserveIndex: number) => {
    const newStarters = [...starters];
    const newReserves = [...reserves];
    
    const temp = newStarters[starterIndex];
    newStarters[starterIndex] = newReserves[reserveIndex];
    newReserves[reserveIndex] = temp;
    
    setStarters(newStarters);
    setReserves(newReserves);
  };
  
  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };
  
  const handleSetCaptain = (playerId: number) => {
    setCaptain(playerId);
  };
  
  const handleSetPenaltyTaker = (playerId: number) => {
    setPenaltyTaker(playerId);
  };
  
  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando dados do time...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Menu de navegação esquerdo */}
      <View style={styles.leftMenu}>
        <View style={styles.menuItem}>
          <MaterialIcons name="home" size={24} color="#fff" />
          <Text style={styles.menuText}>Principal</Text>
        </View>
        <View style={[styles.menuItem, styles.activeMenuItem]}>
          <MaterialIcons name="people" size={24} color="#fff" />
          <Text style={styles.menuText}>Elenco</Text>
        </View>
        <View style={styles.menuItem}>
          <MaterialIcons name="emoji-events" size={24} color="#fff" />
          <Text style={styles.menuText}>Competições</Text>
        </View>
        <View style={styles.menuItem}>
          <FontAwesome5 name="exchange-alt" size={24} color="#fff" />
          <Text style={styles.menuText}>Transferências</Text>
        </View>
        <View style={styles.menuItem}>
          <MaterialIcons name="bar-chart" size={24} color="#fff" />
          <Text style={styles.menuText}>Estatísticas</Text>
        </View>
        <View style={styles.menuItem}>
          <MaterialIcons name="fitness-center" size={24} color="#fff" />
          <Text style={styles.menuText}>Treinamento</Text>
        </View>
        <View style={styles.menuItem}>
          <MaterialCommunityIcons name="finance" size={24} color="#fff" />
          <Text style={styles.menuText}>Finanças</Text>
        </View>
        <View style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
          <Text style={styles.menuText}>Configurações</Text>
        </View>
      </View>

      {/* Conteúdo principal */}
      <View style={styles.mainContent}>
        {/* Cabeçalho com nome do time e controles */}
        <View style={styles.header}>
          <Text style={styles.teamName}>{teamName}</Text>
          <TouchableOpacity style={styles.nextMatchButton}>
            <Text style={styles.nextMatchButtonText}>Próxima Partida</Text>
            <MaterialIcons name="play-arrow" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Controles de formação e tática */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Formação:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={currentFormation.value}
                style={styles.picker}
                onValueChange={handleFormationChange}
              >
                {formations.map(formation => (
                  <Picker.Item 
                    key={formation.value} 
                    label={formation.name} 
                    value={formation.value} 
                  />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Tática:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tactic}
                style={styles.picker}
                onValueChange={(value) => setTactic(value as TacticType)}
              >
                <Picker.Item label="Defensiva" value="defensive" />
                <Picker.Item label="Equilibrada" value="balanced" />
                <Picker.Item label="Ofensiva" value="offensive" />
                <Picker.Item label="Contra-ataque" value="counter" />
                <Picker.Item label="Posse de bola" value="possession" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Estilo:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={playStyle}
                style={styles.picker}
                onValueChange={(value) => setPlayStyle(value as PlayStyle)}
              >
                <Picker.Item label="Passes Curtos" value="short_pass" />
                <Picker.Item label="Bolas Longas" value="long_ball" />
                <Picker.Item label="Jogo pelas Laterais" value="wings" />
                <Picker.Item label="Jogo pelo Centro" value="central" />
              </Picker>
            </View>
          </View>
        </View>
        
        {/* Campo de jogo com jogadores */}
        <View style={styles.field}>
          {/* Linhas do campo */}
          <View style={styles.fieldMarkings}>
            <View style={styles.centerCircle} />
            <View style={styles.centerLine} />
            <View style={styles.penaltyAreaTop} />
            <View style={styles.penaltyAreaBottom} />
            <View style={styles.goalAreaTop} />
            <View style={styles.goalAreaBottom} />
          </View>
          
          {/* Jogadores no campo */}
          {starters.map((player, index) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.player,
                {
                  left: currentFormation.positions[index].x,
                  top: currentFormation.positions[index].y,
                },
                player.isInjured && styles.injuredPlayer,
                player.isSuspended && styles.suspendedPlayer,
                captain === player.id && styles.captainPlayer,
              ]}
              onPress={() => handlePlayerSelect(player)}
            >
              <View style={styles.playerCircle}>
                {captain === player.id && (
                  <View style={styles.captainBadge}>
                    <Text style={styles.captainText}>C</Text>
                  </View>
                )}
                <Text style={styles.playerNumber}>{index + 1}</Text>
              </View>
              <View style={styles.playerLabel}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerOverall}>{player.overall}</Text>
              </View>
              
              {/* Status icons */}
              <View style={styles.statusIcons}>
                {player.isInjured && (
                  <MaterialIcons name="healing" size={16} color="red" />
                )}
                {player.isSuspended && (
                  <MaterialIcons name="block" size={16} color="orange" />
                )}
                {penaltyTaker === player.id && (
                  <MaterialIcons name="sports-soccer" size={16} color="white" />
                )}
              </View>
              
              {/* Energy bar */}
              <View style={styles.energyBarContainer}>
                <View style={[styles.energyBar, { width: `${player.energy}%` }]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Área de informações sobre o jogador selecionado */}
        {selectedPlayer && (
          <View style={styles.playerDetails}>
            <Image 
              source={{ uri: selectedPlayer.photo_url }}
              style={styles.playerDetailImage}
              defaultSource={require('../assets/default-player.png')}
            />
            <View style={styles.playerDetailInfo}>
              <Text style={styles.playerDetailName}>{selectedPlayer.name}</Text>
              <Text style={styles.playerDetailPosition}>{selectedPlayer.position}</Text>
              <Text style={styles.playerDetailOverall}>Overall: {selectedPlayer.overall}</Text>
              
              <View style={styles.playerRoleButtons}>
                <TouchableOpacity 
                  style={[styles.roleButton, captain === selectedPlayer.id && styles.activeRoleButton]}
                  onPress={() => handleSetCaptain(selectedPlayer.id)}
                >
                  <Text style={styles.roleButtonText}>Capitão</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.roleButton, penaltyTaker === selectedPlayer.id && styles.activeRoleButton]}
                  onPress={() => handleSetPenaltyTaker(selectedPlayer.id)}
                >
                  <Text style={styles.roleButtonText}>Pênalti</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.roleButton, freeKickTaker === selectedPlayer.id && styles.activeRoleButton]}
                  onPress={() => setFreeKickTaker(selectedPlayer.id)}
                >
                  <Text style={styles.roleButtonText}>Falta</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.roleButton, cornerTaker === selectedPlayer.id && styles.activeRoleButton]}
                  onPress={() => setCornerTaker(selectedPlayer.id)}
                >
                  <Text style={styles.roleButtonText}>Escanteio</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Reservas na direita */}
      <View style={styles.reservesPanel}>
        <Text style={styles.reservesPanelTitle}>Banco de Reservas</Text>
        <FlatList
          data={reserves}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={[
                styles.reserveItem,
                item.isInjured && styles.reserveItemInjured,
                item.isSuspended && styles.reserveItemSuspended
              ]}
              onPress={() => handlePlayerSelect(item)}
            >
              <View style={styles.reserveItemContent}>
                <View style={styles.reserveImageContainer}>
                  <View style={styles.reserveCircle}>
                    <Text style={styles.reserveNumber}>{index + 12}</Text>
                  </View>
                </View>
                <View style={styles.reserveInfo}>
                  <Text style={styles.reserveName}>{item.name}</Text>
                  <Text style={styles.reservePosition}>{item.position}</Text>
                  <View style={styles.reserveStats}>
                    <Text style={styles.reserveOverall}>{item.overall}</Text>
                    <View style={styles.reserveEnergyContainer}>
                      <View style={[styles.reserveEnergy, { width: `${item.energy}%` }]} />
                    </View>
                  </View>
                </View>
                {item.isInjured && (
                  <MaterialIcons name="healing" size={20} color="red" style={styles.reserveIcon} />
                )}
                {item.isSuspended && (
                  <MaterialIcons name="block" size={20} color="orange" style={styles.reserveIcon} />
                )}
              </View>
              <View style={styles.dragHandle}>
                <MaterialIcons name="drag-indicator" size={24} color="#888" />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

// Função auxiliar para mapear índice para posição
function getPositionFromIndex(index: number): string {
  const positions = [
    'GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'CAM', 'ST', 'ST'
  ];
  return positions[index] || 'SUB';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Menu lateral esquerdo
  leftMenu: {
    width: 80,
    backgroundColor: '#1a237e',
    padding: 10,
    paddingTop: 40,
  },
  menuItem: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeMenuItem: {
    backgroundColor: '#303f9f',
  },
  menuText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  
  // Conteúdo principal
  mainContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  nextMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
  },
  nextMatchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 5,
  },
  
  // Controles de formação e tática
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlLabel: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  pickerContainer: {
    width: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: 150,
  },
  
  // Campo de futebol
  field: {
    width: '100%',
    height: 400,
    backgroundColor: '#43a047',
    borderRadius: 10,
    position: 'relative',
    marginBottom: 20,
  },
  fieldMarkings: {
    width: '100%',
    height: '100%',
  },
  centerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
    left: '50%',
    top: '50%',
    marginLeft: -40,
    marginTop: -40,
  },
  centerLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#fff',
    top: '50%',
  },
  penaltyAreaTop: {
    position: 'absolute',
    width: 150,
    height: 60,
    borderWidth: 2,
    borderColor: '#fff',
    left: '50%',
    marginLeft: -75,
    top: 0,
  },
  penaltyAreaBottom: {
    position: 'absolute',
    width: 150,
    height: 60,
    borderWidth: 2,
    borderColor: '#fff',
    left: '50%',
    marginLeft: -75,
    bottom: 0,
  },
  goalAreaTop: {
    position: 'absolute',
    width: 60,
    height: 20,
    borderWidth: 2,
    borderColor: '#fff',
    left: '50%',
    marginLeft: -30,
    top: 0,
  },
  goalAreaBottom: {
    position: 'absolute',
    width: 60,
    height: 20,
    borderWidth: 2,
    borderColor: '#fff',
    left: '50%',
    marginLeft: -30,
    bottom: 0,
  },
  
  // Jogadores no campo
  player: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
    width: 70,
  },
  playerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1565c0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  playerNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerLabel: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 4,
    padding: 2,
    marginTop: 4,
    alignItems: 'center',
    width: '100%',
  },
  playerName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  playerOverall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1565c0',
  },
  injuredPlayer: {
    opacity: 0.5,
  },
  suspendedPlayer: {
    opacity: 0.5,
  },
  captainPlayer: {
    zIndex: 20,
  },
  captainBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ffc107',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captainText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusIcons: {
    flexDirection: 'row',
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
    width: 40,
    justifyContent: 'center',
  },
  energyBarContainer: {
    position: 'absolute',
    bottom: -4,
    width: 36,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  energyBar: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  
  // Detalhes do jogador selecionado
  playerDetails: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerDetailImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  playerDetailInfo: {
    flex: 1,
  },
  playerDetailName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerDetailPosition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  playerDetailOverall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 10,
  },
  playerRoleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  activeRoleButton: {
    backgroundColor: '#1565c0',
  },
  roleButtonText: {
    fontSize: 12,
    color: '#333',
  },
  
  // Painel de reservas
  reservesPanel: {
    width: 230,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    padding: 10,
  },
  reservesPanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reserveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  reserveItemInjured: {
    backgroundColor: 'rgba(244,67,54,0.1)',
  },
  reserveItemSuspended: {
    backgroundColor: 'rgba(255,152,0,0.1)',
  },
  reserveItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reserveImageContainer: {
    marginRight: 10,
  },
  reserveCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#607d8b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  reserveNumber: {
    color: '#fff',
    fontSize: 12,
  },
  reserveInfo: {
    flex: 1,
  },
  reserveName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  reservePosition: {
    fontSize: 11,
    color: '#666',
  },
  reserveStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  reserveOverall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1565c0',
    marginRight: 10,
  },
  reserveEnergyContainer: {
    width: 50,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  reserveEnergy: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  reserveIcon: {
    marginLeft: 10,
  },
  dragHandle: {
    padding: 10,
  },
});