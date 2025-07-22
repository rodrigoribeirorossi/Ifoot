import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

const TITULAR_POSITIONS = [
  // Goleiro
  { left: 120, top: 360 },
  // Zagueiros
  { left: 60, top: 280 },
  { left: 180, top: 280 },
  // Laterais
  { left: 30, top: 220 },
  { left: 210, top: 220 },
  // Volantes
  { left: 90, top: 200 },
  { left: 150, top: 200 },
  // Meias
  { left: 70, top: 120 },
  { left: 170, top: 120 },
  // Atacantes
  { left: 100, top: 60 },
  { left: 140, top: 60 },
];

const NUM_RESERVES = 12;

export default function ChooseTeamScreen() {
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
  };

  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  // Função para abrir o card de escolha
  const openChooseCard = async (type: 'titular' | 'reserva', idx: number) => {
    setSelectedType(type);
    setSelectedIndex(idx);

    // Descubra a posição (exemplo: pode ser TITULAR_POSITIONS[idx].position ou outro campo)
    const position = type === 'titular'
      ? getPositionNameByIndex(idx) // Implemente essa função conforme sua lógica
      : 'Qualquer'; // Ou defina a posição dos reservas conforme sua regra

    // Chame a API
    try {
      const res = await fetch(`http://localhost:3001/api/jogadores?position=${position}`);
      const data = await res.json();
      setAvailablePlayers(data);
    } catch (err) {
      setAvailablePlayers([]); // Ou trate erro
    }
  };

  const choosePlayer = (player: any) => {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hora de começar a escolher o seu time e comissão técnica</Text>
        <Text style={styles.cardText}>
          O time deve ser composto por 11 titulares e 12 reservas.{"\n"}
          Cada posição abre 3 opções de escolha.{"\n"}
          Faça a gestão do seu dinheiro e monte o melhor elenco!
        </Text>
      </View>

      <View style={styles.fieldRow}>
        {/* Reservas à esquerda */}
        <View style={styles.reservesBox}>
          <View style={styles.reservesGrid}>
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
          </View>
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
                width: 80, // aumente para acomodar nomes maiores
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
                <View style={{ alignItems: 'center', marginTop: 4, width: 80 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }} numberOfLines={1} ellipsizeMode="tail">
                    {chosenTitular[idx].name}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1976d2' }}>
                    Geral: <Text style={{ fontWeight: 'bold' }}>{chosenTitular[idx].overall}</Text>
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
            Escolha o jogador para a posição {selectedType === 'titular' ? selectedIndex + 1 : `Reserva ${selectedIndex + 1}`}:
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
                  style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 8 }} // aumente o tamanho
                  onError={() =>
                    setImageErrors(errors => ({ ...errors, [player.id]: true }))
                  }
                />
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{player.name}</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#1976d2' }}>Geral: {player.overall}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    minHeight: 420,
  },
  reservesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 32,
    height: 400,
  },
  reservesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 180, // aumente para caber duas colunas de 80px + margem
    marginRight: 32,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    minHeight: 400,
  },
  reserveItem: {
    width: 80,
    alignItems: 'center',
    marginBottom: 18,
    marginHorizontal: 5, // aumente para espaçamento lateral
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
    marginLeft: 40, // Adicione esta linha para mover o campo para a direita
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
  },
  chooseTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionBox: {
    backgroundColor: '#e0e0e0',
    padding: 16, // aumente o padding
    borderRadius: 12, // aumente o raio
    alignItems: 'center',
    marginHorizontal: 8, // aumente o espaçamento
    minWidth: 120, // aumente a largura mínima
  },
});