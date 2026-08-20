import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import CustomSwitch from '../components/CustomSwitch';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';

interface UserData {
  receberNotificacoes?: boolean;
}

// ─── Componente: Item de Menu ─────────────────────────────────────────────────
interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  iconColor?: string;
  isDestructive?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function MenuItem({ icon, title, subtitle, iconColor = '#FFFFFF', isDestructive = false, onPress, rightElement }: MenuItemProps) {
  const color = isDestructive ? '#ef4444' : iconColor;

  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.menuIconCircle, { backgroundColor: isDestructive ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)' }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, isDestructive && { color: '#ef4444' }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : <Feather name="chevron-right" size={18} color={isDestructive ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.2)'} />}
    </TouchableOpacity>
  );
}

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingNotificacao, setLoadingNotificacao] = useState(false);

  // ─── Buscar dados do utilizador ─────────────────────────────────────────
  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      router.replace('/');
      return;
    }

    async function fetchUserData() {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser!.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            receberNotificacoes: data.receberNotificacoes ?? true,
          });
        } else {
          setUserData({ receberNotificacoes: true });
        }
      } catch (error) {
        console.error('[ConfiguracoesScreen] Erro ao buscar dados:', error);
        setUserData({ receberNotificacoes: true });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const handleToggleNotificacao = async (valor: boolean) => {
    if (!auth.currentUser || !userData) return;
    
    setLoadingNotificacao(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      if (valor) {
        const token = await registerForPushNotificationsAsync();
        
        const updateData: any = { receberNotificacoes: true };
        if (token) {
          updateData.expoPushToken = token;
        }

        await updateDoc(userRef, updateData);
        setUserData({ ...userData, receberNotificacoes: true });
        
        if (!token) {
          console.warn('O token de notificação não foi gerado (verifique se está no Expo Go ou num emulador). A preferência foi salva mesmo assim.');
        }
      } else {
        await updateDoc(userRef, {
          receberNotificacoes: false,
          expoPushToken: deleteField()
        });
        setUserData({ ...userData, receberNotificacoes: false });
      }
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar suas preferências.');
    } finally {
      setLoadingNotificacao(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#0a0a1a', '#050B14']} style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ade80" />
          <Text style={styles.loadingText}>Carregando configurações...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a1a', '#050B14']} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Segurança & Privacidade</Text>

            <View style={styles.card}>
              <MenuItem
                icon="lock"
                title="Alterar Senha"
                subtitle="Redefinir a sua senha de acesso"
                iconColor="#f97316"
                onPress={() => router.push('/alterar-senha')}
              />

              <View style={styles.cardDivider} />

              <MenuItem
                icon="bell"
                title="Notificações"
                subtitle="Gerenciar alertas e avisos"
                iconColor="#38bdf8"
                rightElement={
                  loadingNotificacao ? (
                    <ActivityIndicator size="small" color="#4ade80" />
                  ) : (
                    <CustomSwitch 
                      value={userData?.receberNotificacoes ?? true} 
                      onValueChange={handleToggleNotificacao} 
                    />
                  )
                }
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },

  card: {
    backgroundColor: 'rgba(15, 15, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 16,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
  },
});
