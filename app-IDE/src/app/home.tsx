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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  updateDoc,
  doc,
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

function formatarDataAviso(ts: Timestamp | null): string {
  if (!ts) return '';
  try {
    const date = ts.toDate();
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const hora = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} às ${hora}:${min}`;
  } catch {
    return '';
  }
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

const menuItems = [
  { id: '1', title: 'Igreja', icon: 'church', family: 'FontAwesome5', route: '/igreja' },
  { id: '2', title: 'Cultos', icon: 'users', family: 'Feather', route: '/cultos' },
  { id: '3', title: 'Células', icon: 'account-group', family: 'MaterialCommunityIcons', route: '/celulas' },
  { id: '4', title: 'Pedidos', icon: 'praying-hands', family: 'FontAwesome5', route: '/pedidos' },
  { id: '5', title: 'Eventos', icon: 'calendar', family: 'Feather', route: '/eventos' },
  { id: '6', title: 'Avisos', icon: 'bell', family: 'Feather', route: '/avisos' },
  { id: '7', title: 'Doações', icon: 'hand-holding-heart', family: 'FontAwesome5', route: '/doacoes' },
  { id: '8', title: 'Devocional', icon: 'book-open', family: 'Feather', route: '/devocional' },
  { id: '9', title: 'Ministérios', icon: 'fire', family: 'FontAwesome5', route: '/ministerios' },
];

export default function HomeScreen() {
  const router = useRouter();

  // ─── Estados Dinâmicos ────────────────────────────────────────────────────
  const [greeting, setGreeting] = useState('Olá');
  const [currentDate, setCurrentDate] = useState('');

  // ─── Estados do Firestore ─────────────────────────────────────────────────
  const [avisoDestaque, setAvisoDestaque] = useState<Aviso | null>(null);
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

  const toggleProfileMenu = (open) => {
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

  // ─── Notificações Push ────────────────────────────────────────────────────
  useEffect(() => {
    async function setupPushNotifications() {
      if (!auth.currentUser) return;
      
      try {
        const token = await registerForPushNotificationsAsync();
        
        if (token) {
          // Atualiza o utilizador no Firestore com o token
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            expoPushToken: token,
          });
          console.log('Push token guardado com sucesso no utilizador');
        }
      } catch (error) {
        console.error('Erro ao configurar Push Notifications:', error);
      }
    }
    
    setupPushNotifications();
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
  const renderIcon = (family: string, name: any, size = 24, color = '#FFFFFF') => {
    switch (family) {
      case 'FontAwesome5': return <FontAwesome5 name={name} size={size} color={color} />;
      case 'Feather': return <Feather name={name} size={size} color={color} />;
      case 'Ionicons': return <Ionicons name={name} size={size} color={color} />;
      case 'MaterialCommunityIcons': return <MaterialCommunityIcons name={name} size={size} color={color} />;
      default: return <Feather name={name} size={size} color={color} />;
    }
  };

  // ─── Componente: Bento Card ───────────────────────────────────────────────
  const BentoCard = ({ title, subtitle, icon, family, route, isLarge, onPressOverride, color = '#4ade80' }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => onPressOverride ? onPressOverride() : (route ? router.push(route as any) : null)}
        style={isLarge ? styles.bentoCardLargeWrapper : styles.bentoCardSmallWrapper}
      >
        <Animated.View style={[styles.bentoCard, isLarge ? styles.bentoCardLarge : styles.bentoCardSmall, { transform: [{ scale: scaleValue }] }]}>
          <View style={[styles.bentoIconContainer, isLarge && { marginBottom: 0, marginRight: 15 }]}>
            {renderIcon(family, icon, isLarge ? 24 : 22, color)}
          </View>
          <View style={styles.bentoTextContainer}>
            <Text style={styles.bentoTitle}>{title}</Text>
            {isLarge && subtitle && <Text style={styles.bentoSubtitle}>{subtitle}</Text>}
          </View>
          {isLarge && (
            <View style={styles.bentoActionIcon}>
              <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.3)" />
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  };

  // ─── Componente: Card Horizontal (Explorar Mais) ──────────────────────────
  const AnimatedMoreCard = ({ item, color }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    const getBgColorWithOpacity = (hexColor: string) => {
      return hexColor + '20';
    };

    return (
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => router.push(item.route as any)}
      >
        <Animated.View style={[styles.moreCard, { transform: [{ scale: scaleValue }] }]}>
          <View style={[styles.moreCardIconCircle, { backgroundColor: getBgColorWithOpacity(color) }]}>
            {renderIcon(item.family, item.icon, 24, color)}
          </View>
          <Text style={styles.moreCardTitle}>{item.title}</Text>
        </Animated.View>
      </Pressable>
    );
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
  return (
    <ImageBackground
      source={require('../../assets/Img/Bg.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Overlay escuro em cima da imagem de fundo para dar contraste */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ─── Header: Saudação Dinâmica ─────────────────────────────── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingText}>{greeting}, Membro</Text>
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => toggleProfileMenu(true)}>
              <Feather name="user" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* ─── Hero: Próximo Evento (Dinâmico do Firestore) ──────────── */}
          {isLoading ? (
            <View style={[styles.fakeGlass, styles.heroCard, { alignItems: 'center', justifyContent: 'center', minHeight: 160 }]}>
              <ActivityIndicator size="large" color="#4ade80" />
              <Text style={{ color: '#AAAAAA', marginTop: 12, fontSize: 14 }}>Carregando...</Text>
            </View>
          ) : proximoEvento ? (
            <View style={[styles.fakeGlass, styles.heroCard]}>
              <View style={styles.heroHeader}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>PRÓXIMO EVENTO</Text>
                </View>
                <View style={styles.heroDateBadge}>
                  <Feather name="calendar" size={14} color="#4ade80" />
                  <Text style={styles.heroDateText}>
                    {getDia(proximoEvento.dataHora)} {getMes(proximoEvento.dataHora)}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>{proximoEvento.titulo}</Text>
              <View style={styles.heroInfoRow}>
                <View style={styles.heroInfoItem}>
                  <Feather name="clock" size={14} color="#AAAAAA" />
                  <Text style={styles.heroSubtitle}>
                    {getDiaSemana(proximoEvento.dataHora)} às {getHora(proximoEvento.dataHora)}
                  </Text>
                </View>
                {proximoEvento.local ? (
                  <View style={styles.heroInfoItem}>
                    <Ionicons name="location-outline" size={14} color="#AAAAAA" />
                    <Text style={styles.heroSubtitle}>{proximoEvento.local}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/eventos')}>
                <Text style={styles.heroButtonText}>Ver Todos os Eventos</Text>
                <Feather name="arrow-right" size={16} color="#000000" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.fakeGlass, styles.heroCard]}>
              <View style={styles.heroHeader}>
                <View style={[styles.liveBadge, { backgroundColor: 'rgba(170, 170, 170, 0.15)' }]}>
                  <Feather name="calendar" size={12} color="#AAAAAA" />
                  <Text style={[styles.liveText, { color: '#AAAAAA', marginLeft: 6 }]}>EVENTOS</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Nenhum evento próximo</Text>
              <Text style={[styles.heroSubtitle, { marginBottom: 20 }]}>
                Fique atento! Novos eventos serão publicados em breve.
              </Text>
              <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/eventos')}>
                <Text style={styles.heroButtonText}>Ver Histórico</Text>
                <Feather name="arrow-right" size={16} color="#000000" />
              </TouchableOpacity>
            </View>
          )}

          {/* ─── Aviso em Destaque (Dinâmico do Firestore) ─────────────── */}
          {avisoDestaque && (
            <View style={[styles.sectionContainer, { paddingHorizontal: 20 }]}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="bullhorn-outline"
                    size={18}
                    color={avisoDestaque.prioridade === 'alta' ? '#FF6B6B' : '#4ade80'}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sectionTitle}>Aviso Importante</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/avisos')}>
                  <Text style={styles.seeAllText}>Ver todos</Text>
                </TouchableOpacity>
              </View>

              <Pressable
                onPress={() => router.push('/avisos')}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[
                  styles.fakeGlass,
                  styles.avisoDestaqueCard,
                  avisoDestaque.prioridade === 'alta' && styles.avisoDestaqueUrgente,
                ]}>
                  {/* Barra lateral de prioridade */}
                  <View style={[
                    styles.avisoPrioridadeBar,
                    { backgroundColor: avisoDestaque.prioridade === 'alta' ? '#FF6B6B' : '#4ade80' },
                  ]} />

                  <View style={styles.avisoContent}>
                    {/* Badge + Data */}
                    <View style={styles.avisoMetaRow}>
                      <View style={[
                        styles.avisoBadge,
                        { backgroundColor: avisoDestaque.prioridade === 'alta' ? 'rgba(255,107,107,0.15)' : 'rgba(74,222,128,0.15)' },
                      ]}>
                        {avisoDestaque.prioridade === 'alta' ? (
                          <MaterialCommunityIcons name="alert-circle" size={11} color="#FF6B6B" style={{ marginRight: 4 }} />
                        ) : (
                          <MaterialCommunityIcons name="check-circle" size={11} color="#4ade80" style={{ marginRight: 4 }} />
                        )}
                        <Text style={{
                          fontSize: 10,
                          fontWeight: 'bold',
                          letterSpacing: 1,
                          color: avisoDestaque.prioridade === 'alta' ? '#FF6B6B' : '#4ade80',
                        }}>
                          {avisoDestaque.prioridade === 'alta' ? 'URGENTE' : 'AVISO'}
                        </Text>
                      </View>
                      {avisoDestaque.dataCriacao && (
                        <Text style={styles.avisoDate}>
                          {formatarDataAviso(avisoDestaque.dataCriacao)}
                        </Text>
                      )}
                    </View>

                    {/* Título */}
                    <Text style={styles.avisoTitulo} numberOfLines={2}>
                      {avisoDestaque.titulo}
                    </Text>

                    {/* Mensagem (preview) */}
                    {avisoDestaque.mensagem ? (
                      <Text style={styles.avisoMensagem} numberOfLines={2}>
                        {avisoDestaque.mensagem}
                      </Text>
                    ) : null}

                    {/* Autor */}
                    {avisoDestaque.autor ? (
                      <View style={styles.avisoAutorRow}>
                        <Feather name="user" size={12} color="#666666" />
                        <Text style={styles.avisoAutor}>{avisoDestaque.autor}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </View>
          )}

          {/* ─── Quick Actions (Bento Grid) ────────────────────────────── */}
          <View style={styles.sectionContainer}>
            <View style={styles.bentoContainer}>
              {/* Row 1 - Destaque */}
              <View style={styles.bentoRow}>
                <BentoCard
                  title="Pedidos de Oração"
                  subtitle="Envie seus pedidos e interceda"
                  icon="praying-hands"
                  family="FontAwesome5"
                  route="/pedidos"
                  isLarge={true}
                  color="#facc15"
                />
              </View>

              {/* Row 2 */}
              <View style={styles.bentoRow}>
                <BentoCard
                  title="Células"
                  icon="account-group"
                  family="MaterialCommunityIcons"
                  route="/celulas"
                  isLarge={false}
                  color="#60a5fa"
                />
                <BentoCard
                  title="Cultos"
                  icon="users"
                  family="Feather"
                  route="/cultos"
                  isLarge={false}
                  color="#f87171"
                />
              </View>

              {/* Row 3 */}
              <View style={styles.bentoRow}>
                <BentoCard
                  title="Contribuição"
                  icon="hand-holding-heart"
                  family="FontAwesome5"
                  route="/doacoes"
                  isLarge={false}
                  color="#4ade80"
                />
                <BentoCard
                  title="Devocional"
                  icon="book-open"
                  family="Feather"
                  route="/devocional"
                  isLarge={false}
                  color="#c084fc"
                />
              </View>
            </View>
          </View>

          {/* ─── Explorar Mais (Horizontal Scroll) ─────────────────────── */}
          <View style={styles.sectionContainer}>
            <View style={styles.exploreHeader}>
              <View>
                <Text style={styles.sectionTitleWithoutMargin}>Explorar Mais</Text>
                <Text style={styles.exploreSubtitle}>Deslize para ver mais opções</Text>
              </View>
              <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.4)" />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            >
              {/* Igreja */}
              <AnimatedMoreCard item={menuItems[0]} color="#38bdf8" />
              {/* Eventos */}
              <AnimatedMoreCard item={menuItems[4]} color="#fbbf24" />
              {/* Avisos */}
              <AnimatedMoreCard item={menuItems[5]} color="#f472b6" />
              {/* Ministérios */}
              <AnimatedMoreCard item={menuItems[8]} color="#10b981" />
            </ScrollView>
          </View>

        </ScrollView>
      </SafeAreaView>

      <SocialFabMenu />

      {/* ─── Profile Drawer Modal ────────────────────────────────────── */}
      <Modal
        visible={isProfileMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => toggleProfileMenu(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => toggleProfileMenu(false)} />

          <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
            {/* Drawer Header */}
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

              <Text style={styles.profileName}>Leonardo</Text>
              <Text style={styles.profileEmail}>discipuloleonardo@gmail.com</Text>
            </View>

            {/* Drawer Menu List */}
            <View style={styles.drawerList}>
              <DrawerMenuItem icon="user" title="Editar Perfil" onPress={() => { toggleProfileMenu(false); router.push('/perfil'); }} />
              <View style={styles.drawerDivider} />

              <DrawerMenuItem icon="settings" title="Configurações" onPress={() => { toggleProfileMenu(false); router.push('/perfil'); }} />
              <View style={styles.drawerDivider} />

              <DrawerMenuItem icon="heart" title="Minhas Doações" onPress={() => { toggleProfileMenu(false); router.push('/doacoes'); }} />
              <View style={styles.drawerDivider} />

              <DrawerMenuItem icon="bell" title="Notificações" />
            </View>

            {/* Drawer Footer */}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 10, 0.75)',
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // -- ESTILO FAKE GLASSMORPHISM --
  fakeGlass: {
    backgroundColor: 'rgba(15, 15, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // -- Header Dinâmico --
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // -- Hero Section (Próximo Evento) --
  heroCard: {
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 30,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginRight: 6,
  },
  liveText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  heroDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  heroDateText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroInfoRow: {
    marginBottom: 20,
    gap: 6,
  },
  heroInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroSubtitle: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
  },

  // -- Aviso em Destaque --
  avisoDestaqueCard: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  avisoDestaqueUrgente: {
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  avisoPrioridadeBar: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  avisoContent: {
    flex: 1,
    padding: 16,
  },
  avisoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  avisoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  avisoDate: {
    color: '#666666',
    fontSize: 11,
  },
  avisoTitulo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  avisoMensagem: {
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  avisoAutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avisoAutor: {
    color: '#666666',
    fontSize: 12,
  },

  // -- General Sections --
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },

  // -- Bento Grid Actions --
  bentoContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCardLargeWrapper: {
    width: '100%',
  },
  bentoCardSmallWrapper: {
    flex: 1,
  },
  bentoCard: {
    backgroundColor: 'rgba(15, 15, 25, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  bentoCardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  bentoCardSmall: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 16,
    height: 110,
    justifyContent: 'space-between',
  },
  bentoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bentoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bentoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bentoSubtitle: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 4,
  },
  bentoActionIcon: {
    marginLeft: 10,
  },

  // -- Profile Drawer Menu --
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
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
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

  // -- Explorar Mais Cards --
  exploreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitleWithoutMargin: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exploreSubtitle: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 2,
  },
  moreCard: {
    backgroundColor: 'rgba(15, 15, 25, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    width: width * 0.38,
    height: 145,
    padding: 16,
    marginRight: 12,
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  moreCardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
