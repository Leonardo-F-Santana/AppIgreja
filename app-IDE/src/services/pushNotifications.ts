import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

let Notifications: any = null;

try {
  if (Constants.appOwnership !== 'expo') {
    Notifications = require('expo-notifications');
    
    // Configuração padrão para quando o app está em foreground (primeiro plano)
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  }
} catch (error) {
  console.warn('expo-notifications não pôde ser carregado (normal em Expo Go).');
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Notifications) {
    console.log('Push notifications ignoradas pois expo-notifications não foi carregado.');
    return undefined;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    if (Constants.appOwnership === 'expo') {
      console.log('Push notifications não funcionam no Expo Go. Use uma build de desenvolvimento.');
      return undefined;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Falha ao obter permissão para push notifications!');
      return undefined;
    }
    
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? 
        Constants?.easConfig?.projectId ?? 
        'ec572129-260b-44fd-b598-a54466da7bf4';
        
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      console.log('Expo Push Token:', token);
    } catch (error) {
      console.error('Erro ao obter Expo Push Token:', error);
    }
  } else {
    console.log('Tem de usar um dispositivo físico para receber Push Notifications');
  }

  return token;
}
