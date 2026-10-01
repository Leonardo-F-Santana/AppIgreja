import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  ImageBackground,
  Pressable,
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import SocialFabMenu from '../components/SocialFabMenu';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';

const { width } = Dimensions.get('window');

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  prioridade: 'alta' | 'normal';
  autor: string;
  dataCriacao: Timestamp | null;
}

interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  dataHora: string | Timestamp;
  local: string;
  criadoEm: Timestamp | null;
}

// ─── Helpers de Data ──────────────────────────────────────────────────────────

function toDate(dataHora: string | Timestamp): Date {
  if (dataHora instanceof Timestamp) {
    return dataHora.toDate();
  }
  const d = new Date(dataHora);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function getDia(dataHora: string | Timestamp): string {
  return String(toDate(dataHora).getDate()).padStart(2, '0');
}

function getMes(dataHora: string | Timestamp): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(toDate(dataHora))
    .replace('.', '')
    .toUpperCase();
}

function getHora(dataHora: string | Timestamp): string {
  const d = toDate(dataHora);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getDiaSemana(dataHora: string | Timestamp): string {
  const str = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(toDate(dataHora));
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatarData(ts: Timestamp | null): string {
  if (!ts) return '';
  try {
    const date = ts.toDate();
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    const hora = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} às ${hora}:${min}`;
  } catch {
    return '';
  }
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

const gridMenu = [
  { id: '1', title: 'Nossa Igreja', icon: 'church', family: 'FontAwesome5', route: '/igreja' },
  { id: '2', title: 'Escola', icon: 'school', family: 'Ionicons', route: '/escolas' },
  { id: '3', title: 'Células', icon: 'user-friends', family: 'FontAwesome5', route: '/celulas' },
  { id: '4', title: 'Eventos', icon: 'calendar', family: 'Feather', route: '/eventos' },
  { id: '5', title: 'Social', icon: 'share-2', family: 'Feather', route: '/midias' },
  { id: '6', title: 'Devocional', icon: 'book-open', family: 'Feather', route: '/devocional' },
  { id: '7', title: 'Pedidos', icon: 'praying-hands', family: 'FontAwesome5', route: '/pedidos' },
  { id: '8', title: 'Doações', icon: 'hand-holding-heart', family: 'FontAwesome5', route: '/doacoes' },
];

const mockEvents = [
  { id: '1', title: 'Oração das Mães', image: require('../../assets/Img/P1.jpg') },
  { id: '2', title: 'Encontro de adolescentes!', image: require('../../assets/Img/P2.jpg') },
  { id: '3', title: 'Café conexão', image: require('../../assets/Img/P3.jpg') },
];


const getSaudacao = () => {
  const hora = new Date().getHours();
  if (hora >= 0 && hora <= 11) return 'Bom dia';
  if (hora >= 12 && hora <= 17) return 'Boa tarde';
  return 'Boa noite';
};

const mockUserName = "Leonardo";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ─── Estados Dinâmicos ────────────────────────────────────────────────────
  const [greeting, setGreeting] = useState('Olá');
  const [currentDate, setCurrentDate] = useState('');
  const [userName, setUserName] = useState('Membro');
  const [userEmail, setUserEmail] = useState('');

  // ─── Estados do Firestore ─────────────────────────────────────────────────
  const [avisoDestaque, setAvisoDestaque] = useState<Aviso | null>(null);
  const [avisosMural, setAvisosMural] = useState<Aviso[]>([]);
  const [proximoEvento, setProximoEvento] = useState<Evento | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Controle do Drawer ───────────────────────────────────────────────────
  const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toggleProfileMenu(false);
      router.replace('/');
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao tentar sair.');
    }
  };

  // Interpolação para o fundo escuro do drawer
  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, width],
    outputRange: [1, 0],
  });

  const toggleProfileMenu = (open: boolean) => {
    if (open) {
      setProfileMenuVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 14,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: width,
        useNativeDriver: true,
        bounciness: 0,
        speed: 14,
      }).start(() => setProfileMenuVisible(false));
    }
  };

  // ─── Saudação Dinâmica ────────────────────────────────────────────────────
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Bom dia');
    else if (hour >= 12 && hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    const options = { weekday: 'long', day: 'numeric', month: 'long' } as const;
    const dateStr = new Intl.DateTimeFormat('pt-BR', options).format(new Date());
    setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
  }, []);

  // ─── Buscar Dados do Usuário ──────────────────────────────────────────────
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.username || currentUser.email?.split('@')[0] || 'Membro');
          setUserEmail(data.email || currentUser.email || '');
        } else {
          setUserName(currentUser.email?.split('@')[0] || 'Membro');
          setUserEmail(currentUser.email || '');
        }
      },
      (error) => {
        console.error('Erro ao buscar dados do usuário:', error);
        setUserName(currentUser.email?.split('@')[0] || 'Membro');
        setUserEmail(currentUser.email || '');
      }
    );

    return () => unsubscribe();
  }, []);

  // ─── Notificações Push ────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const token = await registerForPushNotificationsAsync();

        if (token) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            expoPushToken: token,
          });
          console.log('Push token guardado com sucesso no utilizador');
        }
      } catch (error) {
        console.error('Erro ao configurar Push Notifications:', error);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // ─── Firestore: Aviso em Destaque (último aviso) ──────────────────────────
  useEffect(() => {
    const avisosRef = collection(db, 'avisos');
    const q = query(avisosRef, orderBy('dataCriacao', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setAvisoDestaque({ id: doc.id, ...doc.data() } as Aviso);
      } else {
        setAvisoDestaque(null);
      }
    }, (error) => {
      console.error('Erro ao buscar avisos:', error);
    });

    return () => unsubscribe();
  }, []);

  // ─── Firestore: Todos os Avisos do Mural ──────────────────────────────────
  useEffect(() => {
    const avisosRef = collection(db, 'avisos');
    const q = query(avisosRef, orderBy('dataCriacao', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Aviso));
      setAvisosMural(docs);
    }, (error) => {
      console.error('Erro ao buscar avisos do mural:', error);
    });

    return () => unsubscribe();
  }, []);

  // ─── Firestore: Próximo Evento (futuro mais próximo) ──────────────────────
  useEffect(() => {
    const eventosRef = collection(db, 'eventos');
    // Busca todos os eventos ordenados por dataHora ascendente
    // e filtra no client-side pois dataHora pode ser string ISO
    const q = query(eventosRef, orderBy('dataHora', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agora = new Date();
      let eventoFuturo: Evento | null = null;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const evento = { id: doc.id, ...data } as Evento;
        const dataEvento = toDate(evento.dataHora);

        if (dataEvento >= agora) {
          eventoFuturo = evento;
          break; // Pega o primeiro evento futuro (mais próximo)
        }
      }

      setProximoEvento(eventoFuturo);
      setIsLoading(false);
    }, (error) => {
      console.error('Erro ao buscar eventos:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Renderização de Ícones ───────────────────────────────────────────────
  const renderIcon = (family: string | undefined, name: any, size = 24, color = '#FFFFFF') => {
    switch (family) {
      case 'FontAwesome5': return <FontAwesome5 name={name} size={size} color={color} />;
      case 'Feather': return <Feather name={name} size={size} color={color} />;
      case 'Ionicons': return <Ionicons name={name} size={size} color={color} />;
      case 'MaterialCommunityIcons': return <MaterialCommunityIcons name={name} size={size} color={color} />;
      default: return <Feather name={name} size={size} color={color} />;
    }
  };

  // ─── Componente: Drawer Menu Item ─────────────────────────────────────────
  const DrawerMenuItem = ({ icon, title, family = 'Feather', isDestructive = false, onPress }: any) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleValue, { toValue: 0.96, useNativeDriver: true }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    return (
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
        <Animated.View style={[styles.drawerMenuItem, { transform: [{ scale: scaleValue }] }]}>
          <View style={styles.drawerMenuIcon}>
            {renderIcon(family, icon, 20, isDestructive ? '#ef4444' : '#FFFFFF')}
          </View>
          <Text style={[styles.drawerMenuTitle, isDestructive && { color: '#ef4444' }]}>
            {title}
          </Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.2)" />
        </Animated.View>
      </Pressable>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const primeiroNome = userName ? userName.split(' ')[0] : 'Membro';

  return (
    <ImageBackground
      source={require('../../assets/Img/Bg.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/Img/logo sem fundo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Meditação do dia */}
          <View style={styles.meditacaoContainer}>
            <Text style={styles.meditacaoLabel}>
              {getSaudacao()}, {mockUserName}! Uma palavra para hoje:
            </Text>
            <View style={styles.meditacaoCard}>
              <Text style={styles.meditacaoText}>
                "E nós conhecemos e cremos no amor que Deus tem por nós. Deus é amor, e quem permanece no amor permanece em Deus, e Deus nele."
              </Text>
              <Text style={styles.meditacaoReference}>1 Jo 4:16</Text>
            </View>
          </View>

          {/* Grid de Navegação */}
          <View style={styles.gridContainer}>
            {gridMenu.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.gridIconCircle}>
                  {renderIcon(item.family, item.icon, 24, '#FFFFFF')}
                </View>
                <Text style={styles.gridItemText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Carrossel de Próximos Eventos */}
          <View style={styles.eventosSection}>
            <Text style={styles.eventosLabel}>Próximos Eventos:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventosScroll}>
              {mockEvents.map((evento) => (
                <TouchableOpacity key={evento.id} style={styles.eventoCard} onPress={() => router.push('/eventos')}>
                  <Image source={evento.image as any} style={styles.eventoImage} resizeMode="contain" />
                  <Text style={styles.eventoTitle}>{evento.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Mural de Avisos */}
          <View style={styles.avisosSection}>
            <Text style={styles.avisosLabel}>Mural de Avisos:</Text>
            {avisosMural.length === 0 ? (
              <Text style={{ color: '#FFFFFF', fontStyle: 'italic', marginLeft: 10 }}>Nenhum aviso no momento</Text>
            ) : (
              avisosMural.map((aviso) => (
                <View key={aviso.id} style={styles.avisoCard}>
                  <View style={styles.avisoIconContainer}>
                    <Feather name="bell" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.avisoTextContainer}>
                    <Text style={styles.avisoTitle}>{aviso.titulo}</Text>
                    <Text style={styles.avisoText}>{aviso.mensagem}</Text>
                    <Text style={styles.avisoDate}>{formatarData(aviso.dataCriacao)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* TabBar Inferior Customizada */}
      <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 8 }]}>
        <View style={styles.tabBarLeft}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/cultos')}>
            <Feather name="users" size={22} color="#000000" />
            <Text style={[styles.tabText, { color: '#000000' }]}>Cultos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/devocional')}>
            <Feather name="book-open" size={22} color="#666666" />
            <Text style={[styles.tabText, { color: '#666666' }]}>Devocional</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBarRight}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/avisos')}>
            <Feather name="bell" size={22} color="#666666" />
            <Text style={[styles.tabText, { color: '#666666' }]}>Notificações</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => toggleProfileMenu(true)}>
            <Feather name="user" size={22} color="#666666" />
            <Text style={[styles.tabText, { color: '#666666' }]}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botão Flutuante WhatsApp */}
      <TouchableOpacity
        style={[styles.fabWhatsApp, { bottom: insets.bottom > 0 ? insets.bottom : 15 }]}
        onPress={() => Linking.openURL('https://wa.me/5521993971641').catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp'))}
      >
        <FontAwesome5 name="whatsapp" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ─── Profile Drawer Modal ────────────────────── */}
      <Modal
        visible={isProfileMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => toggleProfileMenu(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => toggleProfileMenu(false)} />

          <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.drawerHeader}>
              <View style={[styles.profileAvatarPlaceholder, { padding: 0, overflow: 'hidden' }]}>
                <Image
                  source={require('../../assets/Img/profile.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <TouchableOpacity style={styles.changePhotoButton}>
                <Feather name="camera" size={14} color="#AAAAAA" />
                <Text style={styles.changePhotoText}>Alterar foto de perfil</Text>
              </TouchableOpacity>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
            </View>

            <View style={styles.drawerList}>
              <DrawerMenuItem icon="user" title="Meu Perfil" onPress={() => { toggleProfileMenu(false); router.push('/perfil'); }} />
              <View style={styles.drawerDivider} />
              <DrawerMenuItem icon="graduation-cap" title="Minhas Escolas" family="FontAwesome5" onPress={() => { toggleProfileMenu(false); router.push('/escolas'); }} />
              <View style={styles.drawerDivider} />
              <DrawerMenuItem icon="settings" title="Configurações" onPress={() => { toggleProfileMenu(false); router.push('/configuracoes'); }} />
            </View>

            <View style={styles.drawerFooter}>
              <DrawerMenuItem icon="log-out" title="Sair do aplicativo" isDestructive={true} onPress={handleLogout} />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 240,
    height: 100,
  },
  meditacaoContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  meditacaoLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  meditacaoCard: {
    backgroundColor: 'rgba(15, 15, 25, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 100, 0.4)',
    borderRadius: 16,
    padding: 16,
  },
  meditacaoText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  meditacaoReference: {
    color: '#AAAAAA',
    fontSize: 13,
    textAlign: 'right',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 20,
  },
  gridIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  gridItemText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  eventosSection: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  eventosLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  eventosScroll: {
    paddingRight: 20,
  },
  eventoCard: {
    width: 140,
    marginRight: 15,
    alignItems: 'center',
  },
  eventoImage: {
    width: 150,
    height: 200,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  eventoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  avisosSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  avisosLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  avisoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avisoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avisoTextContainer: {
    flex: 1,
  },
  avisoTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  avisoText: {
    color: '#CCCCCC',
    fontSize: 13,
  },
  avisoDate: {
    color: '#999999',
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 10,
    paddingTop: 8,
    minHeight: 55,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  tabBarLeft: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingRight: 35,
  },
  tabBarRight: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: 35,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    color: '#000000',
    marginTop: 4,
    fontWeight: '600',
  },
  fabWhatsApp: {
    position: 'absolute',
    alignSelf: 'center',
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  // -- Drawer Styles --
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    width: width * 0.75,
    height: '100%',
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 40,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  profileAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 2,
    borderColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  changePhotoText: {
    color: '#AAAAAA',
    fontSize: 13,
    marginLeft: 6,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  drawerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  drawerMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  drawerMenuTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },
  drawerFooter: {
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
});
