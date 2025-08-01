import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
//import DraggableFlatList from 'react-native-draggable-flatlist';
import { Dimensions, Platform } from 'react-native';
import { NavigationProp, RootStackParamList } from '../Types/navigation';

// definição de tipos
type Player = {
  id: number;
  name: string;
  position: string;
  overall: number;
  photo_url: string;
  energy: number; // 0-100
  isInjured: boolean;
  isSuspended: boolean;
  // Adicione estas propriedades que vêm do servidor
  isStarter?: boolean;
  isCaptain?: boolean;
  isPenaltyTaker?: boolean;
  isFreekickTaker?: boolean;
  isCornerTaker?: boolean;
};

type FormationType = {
  name: string;
  value: string;
  positions: { x: number; y: number; role: string }[];
};

type TacticType = 'defensive' | 'balanced' | 'offensive' | 'counter' | 'possession';
type PlayStyle = 'short_pass' | 'long_ball' | 'wings' | 'central';

// Adicione esta interface no topo do arquivo, junto com os outros tipos
interface NextMatch {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  competition_name: string;
  match_date: string;
  match_time: string;
  stage: string;
  status: string;
}

export default function TeamManagementScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { teamId } = route.params as { teamId: number };
  
  const [loadingData, setLoadingData] = useState(true);
  const [starters, setStarters] = useState<Player[]>([]);
  const [reserves, setReserves] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [teamName, setTeamName] = useState('Meu Time');
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
  const [loadingNextMatch, setLoadingNextMatch] = useState(false);
  const [currentSeasonId, setCurrentSeasonId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Formações disponíveis
  const formations: FormationType[] = [
    {
      name: '4-4-2',
      value: '442',
      positions: [
        { x: 50, y: 90, role: 'GK' },    // Goleiro
        { x: 20, y: 75, role: 'LB' },    // Lateral Esquerdo
        { x: 35, y: 75, role: 'CB' },    // Zagueiro Esquerdo
        { x: 65, y: 75, role: 'CB' },    // Zagueiro Direito
        { x: 80, y: 75, role: 'RB' },    // Lateral Direito
        { x: 20, y: 50, role: 'LM' },    // Meia Esquerda
        { x: 35, y: 50, role: 'CM' },    // Volante Esquerda
        { x: 65, y: 50, role: 'CM' },    // Volante Direito
        { x: 80, y: 50, role: 'RM' },    // Meia Direita
        { x: 35, y: 25, role: 'ST' },    // Atacante Esquerdo
        { x: 65, y: 25, role: 'ST' },    // Atacante Direito
      ]
    },
    {
      name: '4-3-3',
      value: '433',
      positions: [
        { x: 50, y: 90, role: 'GK' },    // Goleiro
        { x: 20, y: 75, role: 'LB' },    // Lateral Esquerdo
        { x: 35, y: 75, role: 'CB' },    // Zagueiro Esquerdo
        { x: 65, y: 75, role: 'CB' },    // Zagueiro Direito
        { x: 80, y: 75, role: 'RB' },    // Lateral Direito
        { x: 35, y: 55, role: 'CM' },    // Meia Esquerda
        { x: 50, y: 60, role: 'CDM' },   // Volante Central
        { x: 65, y: 55, role: 'CM' },    // Meia Direito
        { x: 20, y: 30, role: 'LW' },    // Ponta Esquerda
        { x: 50, y: 25, role: 'ST' },    // Atacante Central
        { x: 80, y: 30, role: 'RW' },    // Ponta Direita
      ]
    },
    {
      name: '4-2-3-1',
      value: '4231',
      positions: [
        { x: 50, y: 90, role: 'GK' },    // Goleiro
        { x: 20, y: 75, role: 'LB' },    // Lateral Esquerdo
        { x: 35, y: 75, role: 'CB' },    // Zagueiro Esquerdo
        { x: 65, y: 75, role: 'CB' },    // Zagueiro Direito
        { x: 80, y: 75, role: 'RB' },    // Lateral Direito
        { x: 35, y: 60, role: 'CDM' },   // Volante Esquerda
        { x: 65, y: 60, role: 'CDM' },   // Volante Direita
        { x: 20, y: 40, role: 'CAM' },   // Meia Esquerda
        { x: 50, y: 40, role: 'CAM' },   // Meia Central
        { x: 80, y: 40, role: 'CAM' },   // Meia Direita
        { x: 50, y: 25, role: 'ST' },    // Atacante Central
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
  
  // Adicione esses estados para controle de seleção
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPlayerType, setSelectedPlayerType] = useState<'starter' | 'reserve' | null>(null);
  
  // Simulação de carregamento de dados do time
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoadingData(true);
        
        // Obter nome do time
        const teamResponse = await fetch(`http://localhost:3001/api/teams/${teamId}`);
        const teamData = await teamResponse.json();
        setTeamName(teamData.name || 'Lendas FC');
        
        // Obter jogadores do time
        const playersResponse = await fetch(`http://localhost:3001/api/team-players/${teamId}`);
        const playersData = await playersResponse.json();
        
        if (playersData && playersData.length > 0) {
          // Separar titulares e reservas
          const titulares = playersData
            .filter((player: Player) => player.isStarter)
            .slice(0, 11);
          
          const suplentes = playersData
            .filter((player: Player) => !player.isStarter)
            .slice(0, 12);
          
          setStarters(titulares);
          setReserves(suplentes);
          
          // Definir capitão e outros papéis baseados nos dados carregados
          const captain = playersData.find((player: Player) => player.isCaptain);
          if (captain) setCaptain(captain.id);
          
          const penaltyTaker = playersData.find((player: Player) => player.isPenaltyTaker);
          if (penaltyTaker) setPenaltyTaker(penaltyTaker.id);
          
          const freeKickTaker = playersData.find((player: Player) => player.isFreekickTaker);
          if (freeKickTaker) setFreeKickTaker(freeKickTaker.id);
          
          const cornerTaker = playersData.find((player: Player) => player.isCornerTaker);
          if (cornerTaker) setCornerTaker(cornerTaker.id);
        } else {
          // Se não houver jogadores carregados, use dados simulados como fallback
          const mockStarters = Array(11).fill(null).map((_, index) => ({
            id: index + 1,
            name: `Jogador ${index + 1}`,
            position: getPositionFromIndex(index),
            overall: Math.floor(Math.random() * 15) + 75,
            photo_url: 'https://example.com/default-player.png',
            energy: Math.floor(Math.random() * 30) + 70,
            isInjured: false,
            isSuspended: false,
          }));
          
          const mockReserves = Array(12).fill(null).map((_, index) => ({
            id: index + 12,
            name: `Reserva ${index + 1}`,
            position: getPositionFromIndex(Math.floor(Math.random() * 11)),
            overall: Math.floor(Math.random() * 10) + 70,
            photo_url: 'https://example.com/default-player.png',
            energy: Math.floor(Math.random() * 30) + 70,
            isInjured: index === 3,
            isSuspended: index === 5,
          }));
          
          setStarters(mockStarters);
          setReserves(mockReserves);
          setCaptain(1);
          setPenaltyTaker(10);
          setFreeKickTaker(8);
          setCornerTaker(6);
        }
        
        setLoadingData(false);
      } catch (error) {
        console.error("Erro ao carregar dados do time:", error);
        // Usar dados simulados em caso de erro
        useFallbackData();
        setLoadingData(false);
      }
    };
    
    const useFallbackData = () => {
      // Implementação de dados simulados
      const mockStarters = Array(11).fill(null).map((_, index) => ({
        id: index + 1,
        name: `Jogador ${index + 1}`,
        position: getPositionFromIndex(index),
        overall: Math.floor(Math.random() * 15) + 75,
        photo_url: 'https://example.com/default-player.png',
        energy: Math.floor(Math.random() * 30) + 70,
        isInjured: false,
        isSuspended: false,
      }));
      
      const mockReserves = Array(12).fill(null).map((_, index) => ({
        id: index + 12,
        name: `Reserva ${index + 1}`,
        position: getPositionFromIndex(Math.floor(Math.random() * 11)),
        overall: Math.floor(Math.random() * 10) + 70,
        photo_url: 'https://example.com/default-player.png',
        energy: Math.floor(Math.random() * 30) + 70,
        isInjured: index === 3,
        isSuspended: index === 5,
      }));
      
      setStarters(mockStarters);
      setReserves(mockReserves);
      setCaptain(1);
      setPenaltyTaker(10);
      setFreeKickTaker(8);
      setCornerTaker(6);
    };
    
    fetchTeamData();
  }, [teamId]);
  
  // Função para obter a temporada atual
  const fetchCurrentSeason = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/teams/${teamId}/current-season`);
      const data = await response.json();
      if (data.seasonId) {
        setCurrentSeasonId(data.seasonId);
      }
    } catch (error) {
      console.error('Erro ao buscar temporada atual:', error);
    }
  };

  // Chame esta função no useEffect
  useEffect(() => {
    fetchCurrentSeason();
  }, [teamId]);
  
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
  
  // Substitua a função handlePlayerSelect por esta versão atualizada
  const handlePlayerSelect = (player: Player, playerType: 'starter' | 'reserve') => {
    // Se nenhum jogador estiver selecionado, selecione este
    if (selectedPlayerId === null) {
      setSelectedPlayerId(player.id);
      setSelectedPlayerType(playerType);
      setSelectedPlayer(player);
    }
    // Se o mesmo jogador for selecionado novamente, desmarque-o
    else if (selectedPlayerId === player.id) {
      setSelectedPlayerId(null);
      setSelectedPlayerType(null);
      setSelectedPlayer(null);
    }
    // Se outro jogador for selecionado, faça a substituição
    else {
      // Adicione essa verificação de nulidade
      if (selectedPlayerType) {
        // Troca entre titulares e reservas ou dentro do mesmo grupo
        swapPlayers(selectedPlayerId, player.id, selectedPlayerType, playerType);
      }
      
      // Limpa a seleção
      setSelectedPlayerId(null);
      setSelectedPlayerType(null);
      setSelectedPlayer(null);
    }
  };
  
  // Adicione esta função para realizar as substituições
  const swapPlayers = (
    player1Id: number, 
    player2Id: number, 
    player1Type: 'starter' | 'reserve', 
    player2Type: 'starter' | 'reserve'
  ) => {
    // Encontra os índices dos jogadores
    const findPlayerIndex = (playerId: number, players: Player[]) => {
      return players.findIndex(p => p.id === playerId);
    };
    
    // Se ambos são titulares
    if (player1Type === 'starter' && player2Type === 'starter') {
      const index1 = findPlayerIndex(player1Id, starters);
      const index2 = findPlayerIndex(player2Id, starters);
      
      if (index1 !== -1 && index2 !== -1) {
        const newStarters = [...starters];
        [newStarters[index1], newStarters[index2]] = [newStarters[index2], newStarters[index1]];
        setStarters(newStarters);
      }
    }
    // Se ambos são reservas
    else if (player1Type === 'reserve' && player2Type === 'reserve') {
      const index1 = findPlayerIndex(player1Id, reserves);
      const index2 = findPlayerIndex(player2Id, reserves);
      
      if (index1 !== -1 && index2 !== -1) {
        const newReserves = [...reserves];
        [newReserves[index1], newReserves[index2]] = [newReserves[index2], newReserves[index1]];
        setReserves(newReserves);
      }
    }
    // Se um é titular e outro é reserva
    else {
      const starterIndex = player1Type === 'starter' 
        ? findPlayerIndex(player1Id, starters)
        : findPlayerIndex(player2Id, starters);
        
      const reserveIndex = player1Type === 'reserve'
        ? findPlayerIndex(player1Id, reserves)
        : findPlayerIndex(player2Id, reserves);
        
      if (starterIndex !== -1 && reserveIndex !== -1) {
        const newStarters = [...starters];
        const newReserves = [...reserves];
        
        const starterPlayer = {...newStarters[starterIndex]};
        const reservePlayer = {...newReserves[reserveIndex]};
        
        newStarters[starterIndex] = reservePlayer;
        newReserves[reserveIndex] = starterPlayer;
        
        setStarters(newStarters);
        setReserves(newReserves);
      }
    }
  };
  
  const handleSetCaptain = (playerId: number) => {
    setCaptain(playerId);
  };
  
  const handleSetPenaltyTaker = (playerId: number) => {
    setPenaltyTaker(playerId);
  };

  // Função para salvar a configuração do time
  const saveTeamConfiguration = async () => {
    try {
      setIsSaving(true);
      
      // Enviar dados do time para o servidor
      const response = await fetch(`http://localhost:3001/api/teams/${teamId}/save-configuration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formation: currentFormation.value,
          tactic,
          playStyle,
          captain,
          penaltyTaker,
          freeKickTaker,
          cornerTaker,
          starters: starters.map(player => player.id),
          reserves: reserves.map(player => player.id)
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Sucesso', 'Configuração do time salva com sucesso!');
      } else {
        Alert.alert('Erro', 'Falha ao salvar a configuração do time.');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao salvar a configuração.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Então substitua o botão existente por este:
  return (
    <View style={styles.container}>
      {/* Menu de navegação esquerdo */}
      <View style={styles.leftMenu}>
        {/* Novo botão Central de Jogo */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('GameCentral', { teamId })}
        >
          <MaterialIcons name="sports-soccer" size={24} color="#fff" />
          <Text style={styles.menuText}>Central de Jogo</Text>
        </TouchableOpacity>
        
        {/* Botão atual (Elenco) */}
        <View style={[styles.menuItem, styles.activeMenuItem]}>
          <MaterialIcons name="people" size={24} color="#fff" />
          <Text style={styles.menuText}>Elenco</Text>
        </View>
        
        {/* Botão de Calendário - Adicione este código */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            if (currentSeasonId) {
              navigation.navigate('Calendar', { 
                teamId: teamId, 
                seasonId: currentSeasonId 
              });
            } else {
              Alert.alert('Temporada não iniciada', 'Inicie uma temporada primeiro para acessar o calendário!');
            }
          }}
        >
          <MaterialIcons name="calendar-today" size={24} color="#fff" />
          <Text style={styles.menuText}>Calendário</Text>
        </TouchableOpacity>
        
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
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={saveTeamConfiguration}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Salvando...' : 'Salvar Equipe'}
            </Text>
            {!isSaving && <MaterialIcons name="save" size={18} color="#fff" style={styles.buttonIcon} />}
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
          
          <View style={styles.controlDivider} />
          
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
          
          <View style={styles.controlDivider} />
          
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
            {/* Linha central e círculo central */}
            <View style={styles.centerCircle} />
            <View style={styles.centerLine} />
            
            {/* Áreas de pênalti */}
            <View style={styles.penaltyAreaTop} />
            <View style={styles.penaltyAreaBottom} />
            
            {/* Áreas de gol */}
            <View style={styles.goalAreaTop} />
            <View style={styles.goalAreaBottom} />
            
            {/* Linhas laterais (novas) */}
            <View style={styles.leftLine} />
            <View style={styles.rightLine} />
            
            {/* Marcas de pênalti (novas) */}
            <View style={styles.penaltyMarkTop} />
            <View style={styles.penaltyMarkBottom} />
          </View>
          
          {/* Jogadores no campo com posicionamento relativo */}
          {starters.map((player, index) => {
            // Verifica se a posição existe no array de posições
            if (!currentFormation.positions[index]) return null;
            
            const position = currentFormation.positions[index];
            
            return (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.player,
                  {
                    position: 'absolute',
                    left: `${position.x - 5}%`,  // Ajuste fino para centralizar
                    top: `${position.y - 5}%`,   // Ajuste fino para centralizar
                  },
                  player.isInjured && styles.injuredPlayer,
                  player.isSuspended && styles.suspendedPlayer,
                  captain === player.id && styles.captainPlayer,
                  selectedPlayerId === player.id && styles.selectedPlayer,
                ]}
                onPress={() => handlePlayerSelect(player, 'starter')}
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
                  <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
                    {player.name}
                  </Text>
                  <Text style={styles.playerOverall}>{player.overall}</Text>
                </View>
                
                <View style={styles.energyBarContainer}>
                  <View style={[styles.energyBar, { width: `${player.energy}%` }]} />
                </View>
              </TouchableOpacity>
            );
          })}
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
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <FontAwesome5 
                      name="flag" 
                      size={12} 
                      color={cornerTaker === selectedPlayer.id ? '#fff' : '#333'} 
                      style={{marginRight: 4}}
                    />
                    <Text style={[
                      styles.roleButtonText, 
                      cornerTaker === selectedPlayer.id && {color: '#fff'}
                    ]}>Escanteio</Text>
                  </View>
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
              onPress={() => handlePlayerSelect(item, 'reserve')}
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 5,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  
  // Controles de formação e tática
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  controlLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  controlDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
    alignSelf: 'center',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  
  // Campo de futebol
  field: {
    width: '100%',
    height: 0,
    paddingBottom: '75%',
    backgroundColor: '#43a047',
    borderRadius: 10,
    position: 'relative',
    marginBottom: 20,
    overflow: 'hidden',
  },
  fieldMarkings: {
    width: '100%',
    height: '100%',
    position: 'absolute',
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
  // Novas linhas laterais
  leftLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#fff',
    left: 0,
  },
  rightLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#fff',
    right: 0,
  },
  // Marcas de pênalti
  penaltyMarkTop: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    top: 40,
    left: '50%',
    marginLeft: -3,
  },
  penaltyMarkBottom: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    bottom: 40,
    left: '50%',
    marginLeft: -3,
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
    marginBottom: 4,
  },
  playerNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerLabel: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
    width: '100%',
    maxWidth: 70,
  },
  playerName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  playerOverall: {
    fontSize: 11,
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
    width: 260,
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
    paddingVertical: 10,
    paddingHorizontal: 5,
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
  selectedPlayer: {
    transform: [{scale: 1.1}],
    shadowColor: '#ff9800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 10,
  },
});