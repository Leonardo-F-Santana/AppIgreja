import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// ─── Configuração do handler de notificações (foreground) ──────────────────
// Quando o app está aberto e uma notificação chega, este handler decide
// se ela deve aparecer com alerta, som e badge.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Configurar canal de notificação Android ───────────────────────────────
// No Android 8+ (API 26+), notificações precisam de um canal.
// Criamos o canal o mais cedo possível para que notificações push que
// chegam via FCM/Expo encontrem o canal já registrado com som + vibração.
async function configurarCanalAndroid(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Avisos e Notificações',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4ade80',
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

// Executa na importação do módulo para garantir que o canal existe
// antes mesmo de qualquer notificação chegar.
configurarCanalAndroid().catch((err) =>
  console.warn('[pushNotifications] Erro ao criar canal Android:', err)
);

// ─── Registro de Push Token ────────────────────────────────────────────────

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // Expo Go não suporta push notifications
  if (Constants.appOwnership === 'expo') {
    console.log('[pushNotifications] Push notifications não funcionam no Expo Go. Use uma build de desenvolvimento.');
    return undefined;
  }

  // Push notifications requerem dispositivo físico
  if (!Device.isDevice) {
    console.log('[pushNotifications] Tem de usar um dispositivo físico para receber Push Notifications.');
    return undefined;
  }

  // Garante que o canal Android está criado
  await configurarCanalAndroid();

  // Verifica/solicita permissões
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[pushNotifications] Permissão para push notifications não foi concedida!');
    return undefined;
  }

  // Obtém o Expo Push Token
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      'ec572129-260b-44fd-b598-a54466da7bf4';

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('[pushNotifications] Expo Push Token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('[pushNotifications] Erro ao obter Expo Push Token:', error);
    return undefined;
  }
}
