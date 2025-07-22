import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LoadGameScreenProps = {
  navigation: NativeStackNavigationProp<any, 'LoadGame'>;
};

// Exemplo de dados salvos (posteriormente virá do armazenamento)
const savedGames = [
  { id: '1', teamName: 'Meu Time FC', date: '15/07/2025' },
  { id: '2', teamName: 'Clube Atlético', date: '14/07/2025' },
];

export default function LoadGameScreen({ navigation }: LoadGameScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carregar Jogo Salvo</Text>

      {savedGames.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum jogo salvo encontrado.</Text>
      ) : (
        <FlatList
          data={savedGames}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.saveItem}
              onPress={() => navigation.navigate('Teams')}
            >
              <Text style={styles.teamName}>{item.teamName}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  saveItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});