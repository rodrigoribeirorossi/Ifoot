import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>IFoot Manager</Text>
      </View>

      {/* Conteúdo Principal */}
      <View style={styles.mainContent}>
        {/* Menu Lateral */}
        <View style={styles.sidebar}>
          <Button 
            title="Novo Jogo" 
            onPress={() => navigation.navigate('NewGame')}
            color="#f4511e" 
          />
          <View style={styles.buttonSpacing} />
          <Button 
            title="Carregar Jogo" 
            onPress={() => navigation.navigate('LoadGame')}
            color="#f4511e" 
          />
        </View>

        {/* Área Central */}
        <View style={styles.centerContent}>
          {/*<Image 
            source={require('../assets/manager.png')} 
            style={styles.image}
          />*/}
          <Text style={styles.gameDescription}>
            Bem-vindo ao IFoot Manager!{'\n\n'}
            Você é o novo presidente de uma SAF e tem a missão de transformar 
            seu clube em uma potência do futebol.{'\n\n'}
            • Monte seu time do zero{'\n'}
            • Contrate jogadores e comissão técnica{'\n'}
            • Gerencie o orçamento inicial{'\n'}
            • Compita no Brasileirão{'\n'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#f4511e',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 200,
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  buttonSpacing: {
    height: 10,
  },
  centerContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 300,
    height: 200,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  gameDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#333',
    maxWidth: 600,
  },
});