import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { signOut, User } from 'firebase/auth';
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
import CustomSplashScreen from '../screens/SplashScreen';

// Importa o módulo de push notifications para que o handler e o canal Android
// sejam configurados o mais cedo possível na inicialização do app.
import '../services/pushNotifications';

// Impede que a splash screen nativa suma automaticamente
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Feather.font,
    ...FontAwesome5.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();

  // Fallback de segurança: nunca deixa o app travado na splash por mais de 8s
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      SplashScreen.hideAsync().catch(() => {});
    }, 8000);
    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    let cancelled = false;
    async function prepare() {
      try {
        // Aguarda o Firebase restaurar a sessão persistida no AsyncStorage.
        await auth.authStateReady();
        if (cancelled) return;

        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const rememberMe = await AsyncStorage.getItem('@lembrar_me_status');
            if (rememberMe === 'false') {
              // O utilizador escolheu não ser lembrado
              await signOut(auth);
              setUser(null);
            } else {
              // O utilizador escolheu ser lembrado (ou é undefined)
              setUser(currentUser);
            }
          } catch (e) {
            console.warn('Erro ao ler AsyncStorage', e);
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.warn('Erro ao restaurar sessão de autenticação:', e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    }
    prepare();

    return () => {
      cancelled = true;
    };
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/home');
      }

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
          } else if (data?.tipo === 'aviso_kids') {
            router.push('/AvisosKids');
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
  }, [loading, router]);

  // ─── Trava de Carregamento com a Splash Customizada (Loading Lock) ───
  // Segura a Splash Screen na tela enquanto o Firebase valida o AsyncStorage,
  // impedindo qualquer renderização prematura da tela de Login.
  if (loading) {
    return <CustomSplashScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F19' }}>
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName={user ? 'home' : 'index'}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="kids" />
        <Stack.Screen name="AvisosKids" />
        <Stack.Screen name="avisos-kids" />
      </Stack>
    </View>
  );
}
