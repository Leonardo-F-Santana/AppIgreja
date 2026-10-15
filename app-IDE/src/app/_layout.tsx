import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

// Importa o módulo de push notifications para que o handler e o canal Android
// sejam configurados o mais cedo possível na inicialização do app.
// Isso garante que notificações push cheguem com som e alerta mesmo antes
// do usuário navegar para a tela Home.
import '../services/pushNotifications';

// Impede que a splash screen nativa suma automaticamente
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  // Pré-carrega todas as fontes de ícones usadas no app para evitar
  // o erro "Unable to download asset" no ExpoAsset.downloadAsync
  const [fontsLoaded, fontError] = useFonts({
    ...Feather.font,
    ...FontAwesome5.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

  const [appIsReady, setAppIsReady] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Valores animados
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const router = useRouter();

  // Fallback de segurança: nunca deixa o app travado na splash por mais de 8s
  // (ex.: fontes que nunca carregam). A verificação de sessão continua em
  // segundo plano mesmo que este fallback dispare.
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setAppIsReady(true);
    }, 8000);
    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    let cancelled = false;
    async function prepare() {
      try {
        // Aguarda o Firebase restaurar a sessão persistida no AsyncStorage.
        // IMPORTANTE: não usar timeout curto aqui. Ao abrir o app após algum tempo
        // fechado, o Firebase precisa renovar o token pela rede antes de confirmar
        // o utilizador, o que pode levar vários segundos em redes móveis.
        await auth.authStateReady();
        if (cancelled) return;

        const user = auth.currentUser;
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

        // Pequeno atraso extra para garantir uma transição suave da Splash
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn(e);
      } finally {
        if (!cancelled) {
          setAppIsReady(true);
        }
      }
    }
    prepare();

    return () => {
      cancelled = true;
    };
  }, [fontsLoaded, fontError, router]);

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

      // ─── Lógica de redirecionamento de Push Notifications (Deep Linking) ───
      let NotificationsModule: any = null;
      const Constants = require('expo-constants').default || require('expo-constants');
      if (Constants.appOwnership !== 'expo') {
        try {
          NotificationsModule = require('expo-notifications');
        } catch (e) {
          // Ignora
        }
      }

      if (NotificationsModule) {
        const handleNotificationTap = (response: any) => {
          const data = response?.notification?.request?.content?.data;
          if (data?.tipo === 'aviso') {
            router.push('/avisos');
          } else if (data?.tipo === 'evento_lembrete') {
            router.push('/eventos');
          }
        };

        // 1. Verifica se a aplicação foi aberta a partir de uma notificação fechada (Cold Boot)
        NotificationsModule.getLastNotificationResponseAsync().then((response: any) => {
          if (response) {
            handleNotificationTap(response);
          }
        });

        // 2. Ouve toques em notificações enquanto a app está em background ou foreground
        const sub = NotificationsModule.addNotificationResponseReceivedListener((response: any) => {
          handleNotificationTap(response);
        });

        return () => sub.remove();
      }
    }
  }, [appIsReady, opacity, scale, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F19' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="kids" />
        <Stack.Screen name="AvisosKids" />
        <Stack.Screen name="avisos-kids" />
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
            } as any}
          />
        </Animated.View>
      )}
    </View>
  );
}
