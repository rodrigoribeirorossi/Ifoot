import React from 'react';
import { View, Text } from 'react-native';

export default function HistoryScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>Histórico de Partidas</Text>
      {/* Adicione aqui a lista de partidas simuladas futuramente */}
    </View>
  );
}