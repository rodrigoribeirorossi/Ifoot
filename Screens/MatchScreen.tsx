import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';

export default function MatchScreen() {
  const [result, setResult] = useState(null);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>Simular Partida</Text>
      <Button title="Simular" onPress={() => setResult({ homeGoals: 2, awayGoals: 1, events: ['Gol de A', 'Gol de B', 'Gol de A'] })} />
      {result && (
        <View style={{ marginTop: 20 }}>
          <Text>{`Placar: ${result.homeGoals} x ${result.awayGoals}`}</Text>
          {result.events.map((e, i) => <Text key={i}>{e}</Text>)}
        </View>
      )}
    </View>
  );
}


//import React, { useState } from 'react';
//import { View, Button, Text } from 'react-native';
//import { useMatch } from '../contexts/MatchContext';
//
//export default function MatchScreen() {
//  const { playMatch } = useMatch();
//  const [result, setResult] = useState(null);
//
//  // Exemplo de times mockados
//  const home = { id: '1', name: 'Time A', players: [/* ...11 jogadores... */] };
//  const away = { id: '2', name: 'Time B', players: [/* ...11 jogadores... */] };
//
//  return (
//    <View>
//      <Button title="Simular Partida" onPress={() => setResult(playMatch(home, away))} />
//      {result && (
//        <View>
//          <Text>{`Placar: ${result.result.homeGoals} x ${result.result.awayGoals}`}</Text>
//          {result.events.map((e, i) => <Text key={i}>{e}</Text>)}
//        </View>
//      )}
//    </View>
//  );
//}