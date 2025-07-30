import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Coach = {
  id: number;
  name: string;
  nationality: string;
  age: number;
  overall: number;
  photo_url: string;
  value: number;
  isFree?: boolean; // Novo campo para marcar o técnico gratuito
};

export default function ChooseCoachScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { teamId, budgetRemaining } = route.params as { teamId: number; budgetRemaining: number };
  
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Carregar técnicos disponíveis quando a tela for montada
    fetchCoaches();
  }, []);

  // Cria um técnico gratuito padrão
  const createFreeCoach = (): Coach => {
    return {
      id: 999999, // ID único para o técnico gratuito
      name: "Assistente Técnico",
      nationality: "Brasil",
      age: 45,
      overall: 60, // Overall mais baixo que os técnicos pagos
      photo_url: "https://cdn-icons-png.flaticon.com/512/3003/3003035.png",
      value: 0, // Gratuito
      isFree: true
    };
  };

  const fetchCoaches = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tecnicos?budget=${budgetRemaining}`);
      let data = await res.json();
      
      // Verifica se já existe um técnico gratuito
      const hasFreeCoach = data.some((coach: Coach) => coach.value === 0);
      
      // Se não tiver técnico gratuito ou não houver técnicos acessíveis, adicione um
      if (!hasFreeCoach || (budgetRemaining <= 0 && data.every((coach: Coach) => coach.value > budgetRemaining))) {
        data = [...data, createFreeCoach()];
      }
      
      setCoaches(data);
    } catch (err) {
      console.error('Erro ao buscar técnicos:', err);
      // Em caso de erro, pelo menos mostra o técnico gratuito
      setCoaches([createFreeCoach()]);
    }
  };

  const handleSelectCoach = (coach: Coach) => {
    setSelectedCoach(coach);
  };

  const handleSaveCoach = async () => {
    if (!selectedCoach) {
      alert('Por favor, selecione um técnico');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/save-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          coachId: selectedCoach.id,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert("Técnico contratado com sucesso!");
        // Navegar para a próxima tela (Dashboard ou Campeonato)
        navigation.navigate('SeasonIntro', { teamId });
      }
    } catch (error) {
      console.error("Erro ao salvar técnico:", error);
      alert("Ocorreu um erro ao contratar o técnico.");
    }
  };

  const remainingBudget = budgetRemaining - (selectedCoach?.value || 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Card de instruções */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Escolha seu Técnico</Text>
        <Text style={styles.cardText}>
          O técnico é uma peça fundamental para o sucesso do seu time.{"\n"}
          Cada técnico tem um overall que afetará o desempenho da equipe.{"\n"}
          Escolha com sabedoria dentro do seu orçamento!
        </Text>
        
        {/* Ilustração da prancheta e boné com emojis */}
        <View style={styles.illustrationContainer}>
          <Text style={styles.emojiIcon}>📋</Text>
          <Text style={styles.emojiIcon}>🧢</Text>
        </View>
      </View>

      {/* Card do Caixa */}
      <View style={styles.budgetCard}>
        <Text style={styles.budgetText}>💰 Caixa disponível:</Text>
        <Text style={styles.budgetValue}>€ {remainingBudget.toLocaleString()}</Text>
      </View>

      {/* Lista de técnicos */}
      <View style={styles.coachesContainer}>
        {coaches.map(coach => (
          <TouchableOpacity 
            key={coach.id} 
            style={[
              styles.coachCard,
              selectedCoach?.id === coach.id ? styles.selectedCoach : null,
              coach.isFree ? styles.freeCoachCard : null
            ]}
            onPress={() => handleSelectCoach(coach)}
            disabled={!coach.isFree && coach.value > budgetRemaining}
          >
            <Image
              source={
                imageErrors[coach.id]
                  ? { uri: 'https://www.pngitem.com/pimgs/m/30-307416_profile-icon-png-image-free-download-searchpng-employee.png' }
                  : { uri: coach.photo_url }
              }
              style={styles.coachImage}
              onError={() =>
                setImageErrors(errors => ({ ...errors, [coach.id]: true }))
              }
            />
            <View style={styles.coachInfo}>
              <Text style={styles.coachName}>{coach.name}</Text>
              <Text style={styles.coachNationality}>{coach.nationality}, {coach.age} anos</Text>
              <Text style={styles.coachOverall}>Overall: <Text style={{ color: '#1976d2' }}>{coach.overall}</Text></Text>
              <Text style={styles.coachValue}>
                Valor: <Text style={{ color: coach.isFree ? '#FF6B6B' : '#43a047' }}>
                  {coach.isFree ? 'GRATUITO!' : `€ ${coach.value.toLocaleString()}`}
                </Text>
              </Text>
              
              {coach.isFree && (
                <View style={styles.freeTag}>
                  <Text style={styles.freeTagText}>GRATUITO</Text>
                </View>
              )}
            </View>
            
            {!coach.isFree && coach.value > budgetRemaining && (
              <View style={styles.unavailableOverlay}>
                <Text style={styles.unavailableText}>Sem orçamento</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Botão para confirmar a escolha */}
      <TouchableOpacity 
        style={[
          styles.confirmButton,
          !selectedCoach ? styles.disabledButton : null
        ]}
        onPress={handleSaveCoach}
        disabled={!selectedCoach}
      >
        <Text style={styles.confirmButtonText}>
          {selectedCoach ? 'Contratar Técnico e Iniciar Campeonato' : 'Selecione um técnico'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
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
    marginBottom: 12,
  },
  illustrationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  emojiIcon: {
    fontSize: 50,
    marginHorizontal: 15,
  },
  budgetCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#43a047',
  },
  coachesContainer: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 20,
  },
  coachCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    position: 'relative',
  },
  freeCoachCard: {
    backgroundColor: '#FFF8E1', // Fundo levemente amarelado para destacar
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  selectedCoach: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  coachImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  coachInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coachNationality: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  coachOverall: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coachValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#43a047',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdbdbd',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  freeTag: {
    position: 'absolute',
    right: 0,
    top: -5,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});