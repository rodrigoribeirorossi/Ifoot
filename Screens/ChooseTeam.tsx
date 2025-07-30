import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const TITULAR_POSITIONS = [
  // Goleiro
  { left: 112, top: 325 }, // Reduzido de 360 para 340 para dar espaço ao texto
  // Zagueiros
  { left: 75, top: 265 },  // Ajustado de 60 para 75
  { left: 142, top: 265 }, // Ajustado de 180 para 195
  // Laterais
  { left: 3, top: 220 },
  { left: 210, top: 220 },
  // Volantes
  { left: 75, top: 200 },
  { left: 144, top: 200 },
  // Meias
  { left: 45, top: 120 },
  { left: 170, top: 120 },
  // Atacantes
  { left: 75, top: 60 },
  { left: 140, top: 60 },
];

const NUM_RESERVES = 12;

export default function ChooseTeamScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { budget, difficulty } = route.params as { budget: number; difficulty: string };
  
  // Verifica se é a dificuldade "Rataria"
  const isRataria = difficulty === 'rataria';
  
  // Estado para indicar se está carregando a seleção automática
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  
  // selectedType: 'titular' | 'reserva'
  const [selectedType, setSelectedType] = useState<'titular' | 'reserva' | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [chosenTitular, setChosenTitular] = useState<(null | any)[]>(Array(TITULAR_POSITIONS.length).fill(null));
  const [chosenReserva, setChosenReserva] = useState<(null | any)[]>(Array(NUM_RESERVES).fill(null));
  type Player = {
    id: number;
    name: string;
    position: string;
    age: number;
    nationality: string;
    overall: number;
    club: string;
    photo_url: string;
    height: number;
    weight: number;
    foot: string;
    value: number;
  };

  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  // Função para abrir o card de escolha
  const openChooseCard = async (type: 'titular' | 'reserva', idx: number) => {
    setSelectedType(type);
    setSelectedIndex(idx);

    // Crie uma lista de IDs de jogadores já escolhidos
    const chosenPlayerIds = [
      ...chosenTitular.filter(player => player !== null).map(player => player.id),
      ...chosenReserva.filter(player => player !== null).map(player => player.id)
    ];

    // Descubra a posição
    const position = type === 'titular'
      ? getPositionNameByIndex(idx)
      : 'Qualquer';

    // Chame a API com os IDs de jogadores já escolhidos
    try {
      // Aqui está a mudança principal: adicione o parâmetro exclude à URL
      const excludeParam = chosenPlayerIds.length > 0 ? `&exclude=${chosenPlayerIds.join(',')}` : '';
      const res = await fetch(
        `http://localhost:3001/api/jogadores?position=${position}${excludeParam}`
      );
      const data = await res.json();
      setAvailablePlayers(data);
    } catch (err) {
      console.error('Erro ao buscar jogadores:', err);
      setAvailablePlayers([]);
    }
  };

  const choosePlayer = (player: Player) => {
    // Verificar se há orçamento suficiente
    const playerBeingReplaced = selectedType === 'titular' 
      ? chosenTitular[selectedIndex!] 
      : chosenReserva[selectedIndex!];
    
    // Calcula o impacto no orçamento (considerando caso seja substituição de jogador)
    const replacementValue = playerBeingReplaced?.value || 0;
    const budgetImpact = player.value - replacementValue;
    
    // Verifica se há saldo suficiente para a contratação
    if (calculateRemainingBudget() - budgetImpact < 0) {
      alert('Saldo insuficiente para contratar este jogador!');
      return;
    }

    if (selectedType === 'titular' && selectedIndex !== null) {
      const updated = [...chosenTitular];
      updated[selectedIndex] = player;
      setChosenTitular(updated);
    }
    if (selectedType === 'reserva' && selectedIndex !== null) {
      const updated = [...chosenReserva];
      updated[selectedIndex] = player;
      setChosenReserva(updated);
    }
    
    setSelectedType(null);
    setSelectedIndex(null);
  };

  // Calcular o valor do elenco baseado no valor dos jogadores
  const calculateTeamValue = () => {
    const titularValue = chosenTitular.reduce((sum, player) => sum + (player?.value || 0), 0);
    const reservaValue = chosenReserva.reduce((sum, player) => sum + (player?.value || 0), 0);
    return titularValue + reservaValue;
  };

  // Calcular o saldo disponível no caixa
  const calculateRemainingBudget = () => {
    return budget - calculateTeamValue();
  };

  const isTeamComplete = () => {
    return chosenTitular.every(player => player !== null) && 
           chosenReserva.every(player => player !== null);
  };

  const handleSaveTeam = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/save-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName: "Meu Time Histórico", // Você pode adicionar um input para o nome
          userId: 1, // Usar um sistema de autenticação para obter o ID do usuário
          formation: "4-4-2", // Você pode adicionar seleção de formação
          players: [
            ...chosenTitular.map(player => player),
            ...chosenReserva.map(player => player)
          ],
          budgetRemaining: calculateRemainingBudget(),
          teamValue: calculateTeamValue()
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert("Time salvo com sucesso!");
        // Navegar para a tela de escolha do técnico, passando o ID do time e o orçamento restante
        navigation.navigate('ChooseCoach', { 
          teamId: result.teamId, 
          budgetRemaining: calculateRemainingBudget() 
        });
      }
    } catch (error) {
      console.error("Erro ao salvar o time:", error);
      alert("Ocorreu um erro ao salvar o time.");
    }
  };

  // Função para selecionar jogadores automaticamente (apenas para Rataria)
  const handleAutoSelect = async () => {
    try {
      setIsAutoSelecting(true);
      
      // Chamada para novo endpoint que busca jogadores aleatórios com overall < 80
      const response = await fetch(
        `http://localhost:3001/api/random-players-below-80?count=23` // 11 titulares + 12 reservas
      );
      const players = await response.json();
      
      if (players.length < 23) {
        alert('Não foi possível encontrar jogadores suficientes.');
        setIsAutoSelecting(false);
        return;
      }
      
      // Divide os jogadores em titulares e reservas
      const titulares = players.slice(0, 11);
      const reservas = players.slice(11, 23);
      
      // Atualiza os estados
      setChosenTitular(titulares);
      setChosenReserva(reservas);
      setIsAutoSelecting(false);
    } catch (error) {
      console.error('Erro ao selecionar jogadores automáticos:', error);
      alert('Ocorreu um erro ao selecionar jogadores automaticamente.');
      setIsAutoSelecting(false);
    }
  };

  // Função para abreviar nomes longos
  const shortenName = (name: string, maxLength: number = 14) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Card de instruções */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hora de começar a escolher o seu time e comissão técnica</Text>
        <Text style={styles.cardText}>
          O time deve ser composto por 11 titulares e 12 reservas.{"\n"}
          Cada posição abre 3 opções de escolha.{"\n"}
          Faça a gestão do seu dinheiro e monte o melhor elenco!
        </Text>
      </View>

      {/* Container para os dois novos cards */}
      <View style={styles.cardsRow}>
        {/* Card do Caixa */}
        <View style={styles.budgetCard}>
          <Text style={styles.budgetText}>💰 Caixa disponível:</Text>
          <Text style={styles.budgetValue}>€ {calculateRemainingBudget().toLocaleString()}</Text>
        </View>

        {/* Card do Valor do Elenco */}
        <View style={styles.budgetCard}>
          <Text style={styles.budgetText}>📊 Valor do Elenco:</Text>
          <Text style={styles.budgetValue}>€ {calculateTeamValue().toLocaleString()}</Text>
        </View>
      </View>

      {/* Botão de seleção automática para dificuldade Rataria */}
      {isRataria && (
        <TouchableOpacity 
          style={styles.autoSelectButton}
          onPress={handleAutoSelect}
          disabled={isAutoSelecting}
        >
          <Text style={styles.autoSelectButtonText}>
            {isAutoSelecting ? "Selecionando jogadores..." : "Selecionar Time Aleatoriamente"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Mini campo e reservas */}
      <View style={styles.fieldRow}>
        {/* Reservas à esquerda */}
        <View style={styles.reservesBox}>
          <ScrollView style={{ height: 400, width: 180 }} contentContainerStyle={styles.reservesGrid}>
            {Array.from({ length: NUM_RESERVES }).map((_, idx) => (
              <View key={idx} style={styles.reserveItem}>
                <TouchableOpacity
                  style={[
                    styles.reserveCircle,
                    chosenReserva[idx] && { backgroundColor: '#1976d2', borderColor: '#fff' }
                  ]}
                  onPress={() => !chosenReserva[idx] && openChooseCard('reserva', idx)}
                  disabled={!!chosenReserva[idx]}
                >
                  {chosenReserva[idx] && (
                    <Image
                      source={{ uri: chosenReserva[idx].photo_url }}
                      style={{ width: 24, height: 24, borderRadius: 12 }}
                    />
                  )}
                </TouchableOpacity>
                {chosenReserva[idx] && (
                  <View style={{ alignItems: 'center', marginTop: 2, width: 80 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#333' }} numberOfLines={1} ellipsizeMode="tail">
                      {chosenReserva[idx].name}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1976d2' }}>
                      Geral: <Text style={{ fontWeight: 'bold' }}>{chosenReserva[idx].overall}</Text>
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Campo oficial */}
        <View style={styles.field}>
          {/* Linhas do campo */}
          <View style={styles.lineHorizontalTop} />
          <View style={styles.lineHorizontalBottom} />
          <View style={styles.lineHorizontalMiddle} />
          <View style={styles.circleCentral} />
          <View style={styles.areaGrandeTop} />
          <View style={styles.areaGrandeBottom} />
          <View style={styles.areaPequenaTop} />
          <View style={styles.areaPequenaBottom} />
          <View style={styles.goalTop} />
          <View style={styles.goalBottom} />

          {/* 11 jogadores titulares */}
          {TITULAR_POSITIONS.map((pos, idx) => (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                alignItems: 'center',
                width: 80,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.playerCircle,
                  chosenTitular[idx] && { backgroundColor: '#1976d2', borderColor: '#fff' }
                ]}
                onPress={() => !chosenTitular[idx] && openChooseCard('titular', idx)}
                disabled={!!chosenTitular[idx]}
              >
                {chosenTitular[idx] && (
                  <Image
                    source={{ uri: chosenTitular[idx].photo_url }}
                    style={{ width: 26, height: 26, borderRadius: 13 }}
                  />
                )}
              </TouchableOpacity>
              {chosenTitular[idx] && (
                <View style={{ 
                  alignItems: 'center', 
                  marginTop: 2, 
                  width: 60, 
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  paddingVertical: 1, 
                  borderRadius: 4
                }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#333' }} numberOfLines={1} ellipsizeMode="tail">
                    {chosenTitular[idx].name}
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#00519C' }}>
                    <Text style={{ fontWeight: 'bold', color: '#000' }}>GER:</Text> {chosenTitular[idx].overall}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Card de escolha de jogadores */}
      {selectedType !== null && selectedIndex !== null && (
        <View style={styles.chooseCard}>
          <Text style={styles.chooseTitle}>
            Escolha o jogador para a posição {selectedType === 'titular' ? getPositionNameByIndex(selectedIndex) : `Reserva ${selectedIndex + 1}`}:
          </Text>
          <View style={styles.optionsRow}>
            {availablePlayers.map(player => (
              <TouchableOpacity key={player.id} style={styles.optionBox} onPress={() => choosePlayer(player)}>
                <Image
                  source={
                    imageErrors[player.id]
                      ? require('../assets/default-player.png')
                      : { uri: player.photo_url }
                  }
                  style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 8 }}
                  onError={() =>
                    setImageErrors(errors => ({ ...errors, [player.id]: true }))
                  }
                />
                <Text style={styles.playerName}>{shortenName(player.name)}</Text>
                <Text style={styles.playerPosition}>{player.position}</Text>
                <Text style={styles.playerOverall}>Geral: {player.overall}</Text>
                <Text style={styles.playerValue}>Valor: € {player.value.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Botão para salvar o time */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSaveTeam}
        disabled={!isTeamComplete()}
      >
        <Text style={styles.saveButtonText}>
          {isTeamComplete() ? "Salvar Time e Iniciar Campeonato" : "Complete seu time (11 titulares + 12 reservas)"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getPositionNameByIndex(idx: number): string {
  // Exemplo: retorne o nome da posição conforme o índice
  const positions = [
    'Goleiro', 'Zagueiro', 'Zagueiro', 'Lateral', 'Lateral',
    'Volante', 'Volante', 'Meia', 'Meia', 'Atacante', 'Atacante'
  ];
  return positions[idx] || 'Reserva';
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 500,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: '#333',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    marginBottom: 20,
  },
  budgetCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 10,
    width: '48%', // Cada card ocupa metade da largura disponível
    height: 80, // Altura fixa para os cards
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetText: {
    fontSize: 14, // Tamanho do texto
    fontWeight: 'bold',
    color: '#000', // Texto em preto
  },
  budgetValue: {
    fontSize: 16, // Tamanho do valor
    fontWeight: 'bold',
    color: '#43a047', // Valor em verde
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    minHeight: 420,
  },
  reservesBox: {
    alignItems: 'center',
    justifyContent: 'flex-start',  // Alterado de 'center' para 'flex-start'
    marginRight: 32,
    height: 400,  // Mantém a altura fixa
    overflow: 'hidden', // Impede que o conteúdo transborde
  },
  reservesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 180,
    marginRight: 32,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    height: 400, // Altura fixa em vez de minHeight
    overflow: 'scroll', // Adiciona rolagem quando necessário
  },
  reserveItem: {
    width: 80,
    alignItems: 'center',
    marginBottom: 18,
    marginHorizontal: 55, // aumente para espaçamento lateral
  },
  reserveCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffa726',
    borderWidth: 2,
    borderColor: '#333',
    marginVertical: 6,
  },
  field: {
    width: 300,
    height: 400,
    backgroundColor: '#43a047',
    borderRadius: 10,
    borderWidth: 4,
    borderColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
    marginLeft:0, // Aumentado de 40 para 45 para mover um pouco mais para a direita
  },
  // Linhas do campo
  lineHorizontalTop: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 300, // ajuste para largura total do campo
    height: 2,
    backgroundColor: '#fff',
  },
  lineHorizontalBottom: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 300, // ajuste para largura total do campo
    height: 2,
    backgroundColor: '#fff',
  },
  lineHorizontalMiddle: {
    position: 'absolute',
    left: 0,
    top: 199, // centraliza a linha no meio do campo (400/2 - 1)
    width: 300, // ajuste para largura total do campo
    height: 2,
    backgroundColor: '#fff',
  },
  circleCentral: {
    position: 'absolute',
    left: 100, // (300 - 100) / 2
    top: 150, // (400 - 100) / 2
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  areaGrandeTop: {
    position: 'absolute',
    left: 60, // proporcional ao novo campo
    top: 0,
    width: 180,
    height: 60,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  areaGrandeBottom: {
    position: 'absolute',
    left: 60, // proporcional ao novo campo
    bottom: 0,
    width: 180,
    height: 60,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  areaPequenaTop: {
    position: 'absolute',
    left: 110, // proporcional ao novo campo
    top: 0,
    width: 80,
    height: 30,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  areaPequenaBottom: {
    position: 'absolute',
    left: 110, // proporcional ao novo campo
    bottom: 0,
    width: 80,
    height: 30,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  goalTop: {
    position: 'absolute',
    left: 135, // proporcional ao novo campo
    top: -8,
    width: 30,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  goalBottom: {
    position: 'absolute',
    left: 135, // proporcional ao novo campo
    bottom: -8,
    width: 30,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  playerCircle: {
    //position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#b2dfdb',
    borderWidth: 2,
    borderColor: '#333',
  },
  chooseCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    overflow: 'hidden', // Impede que o conteúdo transborde
  },
  chooseTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribui os cards igualmente
    flexWrap: 'wrap', // Permite quebra de linha se necessário
    alignItems: 'stretch',
  },
  optionBox: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    width: '30%', // Largura fixa para evitar problemas de layout
    maxWidth: 140,
  },
  saveButton: {
    backgroundColor: '#43a047',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  autoSelectButton: {
    backgroundColor: '#FF6B6B', // Cor vermelha para destacar
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  autoSelectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playerName: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    height: 40, // Altura fixa para acomodar até 2 linhas
  },
  playerPosition: {
    fontSize: 13,
    color: '#333',
    marginVertical: 2,
    textAlign: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playerOverall: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1976d2',
    marginTop: 2,
  },
  playerValue: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#43a047',
  },
});