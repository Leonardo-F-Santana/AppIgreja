import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Importa o módulo de push notifications para que o handler e o canal Android
// sejam configurados o mais cedo possível na inicialização do app.
// Isso garante que notificações push cheguem com som e alerta mesmo antes
// do usuário navegar para a tela Home.
import '../services/pushNotifications';

// Impede que a splash screen nativa suma automaticamente
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Valores animados
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        // Aguarda a verificação de autenticação e estado do AsyncStorage
        await new Promise<void>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); // Só queremos checar uma vez no início

            if (user) {
              try {
                const rememberMe = await AsyncStorage.getItem('@lembrar_me_status');
                if (rememberMe === 'false') {
                  // O utilizador escolheu não ser lembrado
                  await signOut(auth);
                  // Continua na tela de login
                } else {
                  // O utilizador escolheu ser lembrado (ou é undefined)
                  router.replace('/home');
                }
              } catch (e) {
                console.warn('Erro ao ler AsyncStorage', e);
              }
            }
            resolve();
          });
        });
        
        // Pequeno atraso extra para garantir uma transição suave da Splash
        await new Promise(resolve => setTimeout(resolve, 300));
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
          // 1. Destaque (Pulse) logo após a nativa fechar
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
        <Stack.Screen name="home" />
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
