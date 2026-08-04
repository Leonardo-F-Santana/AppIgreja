import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Impede que a splash screen nativa suma automaticamente
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Valores animados
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    async function prepare() {
      try {
        // Simula o tempo de carregamento de fontes/dados
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Oculta a tela nativa para revelar nossa tela customizada que vai rodar a animação
      SplashScreen.hideAsync().then(() => {
        // Inicia a sequência de animação
        Animated.sequence([
          // 1. Entrada (Fade-In + Scale Spring)
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            }),
          ]),
          // 2. Destaque (Pulse)
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.05,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // Pausa sutil antes de sair
          Animated.delay(150),
          // 3. Saída (Fade-Out + Zoom out)
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.2,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          // Desmonta a tela customizada revelando o App
          setAnimationComplete(true);
        });
      });
    }
  }, [appIsReady, opacity, scale]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F19' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>

      {!animationComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#0F0F19', // Dark Mode Premium
              opacity: opacity, // Fade-In inicial e Fade-Out final
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
            },
          ]}
        >
          <Animated.Image
            source={require('../../assets/Img/logo sem fundo.png')}
            style={{
              width: 200, 
              height: 200,
              resizeMode: 'contain',
              transform: [{ scale: scale }], // Efeito de entrada e pulso
              shadowColor: 'rgba(255, 255, 255, 0.4)', // DropShadow/Brilho (iOS)
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 30,
              elevation: 15, // DropShadow (Android)
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}
