import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function SeasonIntroScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { teamId } = route.params as { teamId: number };

  const handleStartSeason = () => {
    // Navegar para a tela de Escalação e Tática
    navigation.navigate('TeamManagement', { teamId });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.instructionCard}>
        <Text style={styles.title}>Bem-vindo à sua Temporada!</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Objetivo do Jogo</Text>
          <Text style={styles.sectionText}>
            Seu objetivo é conquistar títulos com seu time de lendas do futebol. Você competirá contra times 
            atuais em diversas competições. Vença jogos, evolua sua equipe e torne-se o melhor treinador de todos os tempos!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Formato da Temporada</Text>
          <Text style={styles.sectionText}>
            A temporada é dividida em 38 rodadas de campeonato, além de jogos de copas nacionais e internacionais.
            Cada vitória te aproxima dos títulos e aumenta sua reputação no mundo do futebol.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚽ Jogos</Text>
          <Text style={styles.sectionText}>
            Os jogos são simulados com base nos atributos dos jogadores, táticas escolhidas e a qualidade do técnico.
            Você pode assistir aos jogos no modo resumido ou detalhado, ou simplesmente ver o resultado final.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Táticas e Formações</Text>
          <Text style={styles.sectionText}>
            Escolha entre diferentes formações e estilos de jogo. Ajuste seus jogadores para maximizar
            o desempenho da equipe. Lembre-se que jogadores fora de posição terão seu desempenho reduzido.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Gerenciamento do Elenco</Text>
          <Text style={styles.sectionText}>
            Gerencie a energia dos jogadores, faça substituições estratégicas e mantenha seu elenco
            em boas condições físicas ao longo da temporada. Jogadores cansados têm maior risco de lesões.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Finanças</Text>
          <Text style={styles.sectionText}>
            Gerencie suas finanças com sabedoria. Prêmios por vitórias e posições no campeonato 
            aumentarão seu orçamento para a próxima temporada. 
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Desenvolvimento de Jogadores</Text>
          <Text style={styles.sectionText}>
            Jogadores podem melhorar seus atributos com boas atuações ou treinamentos específicos.
            Invista no desenvolvimento dos jogadores jovens para o futuro.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
          <Text style={styles.sectionText}>
            Acompanhe estatísticas detalhadas de seus jogadores e do time como um todo.
            Use esses dados para tomar decisões estratégicas e melhorar o desempenho.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 Lendas do Futebol</Text>
          <Text style={styles.sectionText}>
            Seu time é composto por lendas do futebol que deixaram sua marca na história.
            Descubra como teria sido se essas estrelas tivessem jogado juntas contra os times modernos!
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.startButton} onPress={handleStartSeason}>
        <Text style={styles.startButtonText}>Pontapé Inicial</Text>
        <Text style={{fontSize: 24, marginLeft: 8}}>⚽</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  instructionCard: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 15,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  startButton: {
    backgroundColor: '#43a047',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 30,
    width: '80%',
    maxWidth: 300,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});