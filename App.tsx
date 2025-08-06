import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainStack from './Navigation/MainStack';
import * as Font from 'expo-font';
import { View, Text } from 'react-native';
import 'react-native-get-random-values';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        // Fontes necessárias para os ícones
        ...Ionicons.font,
        ...MaterialIcons.font,
        ...MaterialCommunityIcons.font,
        ...FontAwesome5.font,
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Carregando fontes...</Text></View>;
  }

  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}