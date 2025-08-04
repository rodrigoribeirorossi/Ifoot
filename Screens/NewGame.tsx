import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NewGameScreenProps = {
  navigation: NativeStackNavigationProp<any, 'NewGame'>;
};

const difficulties = [
  { label: 'Baixa', value: 'baixa', budget: 100_000_000 },
  { label: 'Média', value: 'media', budget: 60_000_000 },
  { label: 'Difícil', value: 'dificil', budget: 40_000_000 },
  { label: 'Muito Difícil', value: 'muito_dificil', budget: 20_000_000 },
  { label: 'Rataria', value: 'rataria', budget: 12_000_000 },
];

export default function NewGameScreen({ navigation }: NewGameScreenProps) {
  const [teamName, setTeamName] = useState('');
  const [stadiumName, setStadiumName] = useState('');
  const [color1, setColor1] = useState('#0000ff');
  const [color2, setColor2] = useState('#ffffff');
  const [difficulty, setDifficulty] = useState(difficulties[0].value);

  const selectedDifficulty = difficulties.find(d => d.value === difficulty);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vamos criar o seu time e começar a jornada para a Glória Eterna!</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Nome do Time:</Text>
        <TextInput
          style={styles.input}
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Digite o nome do seu time"
        />

        <Text style={styles.label}>Nome do Estádio:</Text>
        <TextInput
          style={styles.input}
          value={stadiumName}
          onChangeText={setStadiumName}
          placeholder="Digite o nome do estádio"
        />

        <Text style={styles.label}>Cores do Time:</Text>
        <View style={styles.colorsRow}>
          <View style={styles.colorBox}>
            <Text>Cor 1:</Text>
            {Platform.OS === 'web' ? (
              <input
                type="color"
                value={color1}
                onChange={e => setColor1((e.target as HTMLInputElement).value)}
                style={{ width: 40, height: 40, border: 'none', background: 'none' }}
                title="Escolha a cor 1"
                aria-label="Escolha a cor 1"
              />
            ) : (
              <TextInput
                style={[styles.input, { width: 80 }]}
                value={color1}
                onChangeText={setColor1}
                placeholder="#0000ff"
              />
            )}
          </View>
          <View style={styles.colorBox}>
            <Text>Cor 2:</Text>
            {Platform.OS === 'web' ? (
              <input
                type="color"
                value={color2}
                onChange={e => setColor2((e.target as HTMLInputElement).value)}
                style={{ width: 40, height: 40, border: 'none', background: 'none' }}
                title="Escolha a cor 2"
                aria-label="Escolha a cor 2"
              />
            ) : (
              <TextInput
                style={[styles.input, { width: 80 }]}
                value={color2}
                onChangeText={setColor2}
                placeholder="#ffffff"
              />
            )}
          </View>
        </View>

        <Text style={styles.label}>Selecione a Dificuldade do jogo:</Text>
        <Picker
          selectedValue={difficulty}
          onValueChange={setDifficulty}
          style={styles.picker}
        >
          {difficulties.map(d => (
            <Picker.Item key={d.value} label={d.label} value={d.value} />
          ))}
        </Picker>
        <Text style={styles.budgetLabel}>
          Orçamento Inicial: {selectedDifficulty ? `€ ${selectedDifficulty.budget.toLocaleString()}` : ''}
        </Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumo</Text>
        <Text>Nome do time: {teamName || '-'}</Text>
        <Text>Nome do estádio: {stadiumName || '-'}</Text>
      <View style={styles.colorSummaryRow}>
        <Text>Cores do time:</Text>
        <View style={[styles.colorCircle, { backgroundColor: color1 }]} />
        <View style={[styles.colorCircle, { backgroundColor: color2 }]} />
      </View>
        <Text>Dificuldade: {selectedDifficulty?.label || '-'}</Text>
        <Text>Orçamento inicial: {selectedDifficulty ? `€ ${selectedDifficulty.budget.toLocaleString()}` : '-'}</Text>
      </View>

      <Button
        title="Começar"
        onPress={() => navigation.navigate('ChooseTeam', { 
          budget: selectedDifficulty?.budget,
          difficulty: difficulty, // Passa o tipo de dificuldade
          teamName: teamName,
          stadiumName: stadiumName,
          color1: color1,
          color2: color2
        })}
        color="#f4511e"
      />
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#f4511e',
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  colorBox: {
    alignItems: 'center',
    marginRight: 20,
  },
  summary: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  colorSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginLeft: 8,
  },
  colorCode: {
    marginLeft: 6,
    fontSize: 12,
    color: '#333',
  },
});