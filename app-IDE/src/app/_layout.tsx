import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Impede que a splash screen nativa suma automaticamente
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  
  // Animação para o efeito de "respiro" (escala do logo)
  const [pulseAnimation] = useState(new Animated.Value(1));
  // Animação para o fade out final quando o app carregar
  const [fadeAnimation] = useState(new Animated.Value(1));
  
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Inicia o efeito de pulso assim que o componente monta
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.15, // Cresce 15%
          duration: 1000, // Demora 1 segundo para encher
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1, // Volta ao normal
          duration: 1000, // Demora 1 segundo para esvaziar
          useNativeDriver: true,
        }),
      ])
    );
    pulsing.start();

    async function prepare() {
      try {
        // Simulando o tempo de carregamento da aplicação
        await new Promise(resolve => setTimeout(resolve, 2500)); // Tempo suficiente para ver a pulsação
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();

    // Limpa a animação quando desmontar se necessário
    return () => pulsing.stop();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Esconde a splash nativa e inicia o Fade Out
      SplashScreen.hideAsync().then(() => {
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 600, // Fade out rápido de 0.6s
          useNativeDriver: true,
        }).start(() => {
          setAnimationComplete(true);
        });
      });
    }
  }, [appIsReady]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>

      {!animationComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#3E2723', // Cor marrom de fundo combinando com o app.json
              opacity: fadeAnimation, // Desaparece no final
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Animated.Image
            style={{
              width: 150, 
              height: 150,
              resizeMode: 'contain',
              transform: [
                {
                  scale: pulseAnimation, // Aplica o efeito de respiro
                },
              ],
            }}
            source={require('../../assets/Img/logo.png')}
          />
        </Animated.View>
      )}
    </View>
  );
}
