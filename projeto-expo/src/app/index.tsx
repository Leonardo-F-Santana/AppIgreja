import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ImageBackground,
  Pressable,
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

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

const mockNotices = [
  { id: '1', title: 'Ensaio Geral do Louvor', date: 'Quinta, 20h', category: 'Música' },
  { id: '2', title: 'Reunião de Liderança', date: 'Sábado, 15h', category: 'Geral' },
];

export default function HomeScreen() {
  const router = useRouter();
  
  // Estados Dinâmicos
  const [greeting, setGreeting] = useState('Olá');
  const [currentDate, setCurrentDate] = useState('');
  
  // Controle do Drawer
  const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Interpolação para o fundo escuro desaparecer/aparecer junto com a gaveta
  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, width],
    outputRange: [1, 0], // Quando o menu está aberto (0), opacidade 100%. Quando fechado (width), 0%.
  });

  const toggleProfileMenu = (open) => {
    if (open) {
      setProfileMenuVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0, 
        useNativeDriver: true,
        bounciness: 0,
        speed: 14, // Animação mais rápida e natural (padrão iOS)
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

  useEffect(() => {
    // Cálculo do horário para a saudação
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Bom dia');
    else if (hour >= 12 && hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    // Formatação da Data (Ex: Segunda-feira, 27 de Julho)
    const options = { weekday: 'long', day: 'numeric', month: 'long' } as const;
    const dateStr = new Intl.DateTimeFormat('pt-BR', options).format(new Date());
    // Capitalizar a primeira letra
    setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
  }, []);

  const renderIcon = (family: string, name: any, size = 24, color = '#FFFFFF') => {
    switch (family) {
      case 'FontAwesome5': return <FontAwesome5 name={name} size={size} color={color} />;
      case 'Feather': return <Feather name={name} size={size} color={color} />;
      case 'Ionicons': return <Ionicons name={name} size={size} color={color} />;
      case 'MaterialCommunityIcons': return <MaterialCommunityIcons name={name} size={size} color={color} />;
      default: return <Feather name={name} size={size} color={color} />;
    }
  };

  // Componente de Botão com Micro-Interação (Fake Glass)
  const AnimatedMenuButton = ({ item }: { item: any }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => router.push(item.route)}
      >
        <Animated.View style={[styles.menuButton, { transform: [{ scale: scaleValue }] }]}>
          <View style={styles.iconCircle}>
            {renderIcon(item.family, item.icon, 22, '#4ade80')}
          </View>
          <Text style={styles.menuTitle}>{item.title}</Text>
        </Animated.View>
      </Pressable>
    );
  };

  // Componente de Item de Lista para o Drawer
  const DrawerMenuItem = ({ icon, title, family = 'Feather', isDestructive = false }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleValue, { toValue: 0.96, useNativeDriver: true }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    return (
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
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
          
          {/* Header - Saudação Dinâmica */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingText}>{greeting}, Leonardo</Text>
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => toggleProfileMenu(true)}>
              <Feather name="user" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Hero Section (Card de Destaque) - Fake Glass */}
          <View style={[styles.fakeGlass, styles.heroCard]}>
            <View style={styles.heroHeader}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>PRÓXIMO</Text>
              </View>
              <Feather name="bookmark" size={20} color="#AAAAAA" />
            </View>
            
            <Text style={styles.heroTitle}>Culto de Celebração</Text>
            <Text style={styles.heroSubtitle}>Domingo às 19:00 - Sede Principal</Text>
            
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/cultos')}>
              <Text style={styles.heroButtonText}>Ver Detalhes</Text>
              <Feather name="arrow-right" size={16} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions (Menu Horizontal) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Acesso Rápido</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuScrollContent}
            >
              {menuItems.map((item) => (
                <AnimatedMenuButton key={item.id} item={item} />
              ))}
            </ScrollView>
          </View>

          {/* Preview de Avisos (Notices) */}
          <View style={[styles.sectionContainer, { paddingHorizontal: 20 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimos Avisos</Text>
              <TouchableOpacity onPress={() => router.push('/avisos')}>
                <Text style={styles.seeAllText}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {mockNotices.map((notice) => (
              <View key={notice.id} style={[styles.fakeGlass, styles.noticeCard]}>
                <View style={styles.noticeIcon}>
                  <Feather name="bell" size={20} color="#4ade80" />
                </View>
                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                  <Text style={styles.noticeDate}>{notice.date} • {notice.category}</Text>
                </View>
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Profile Drawer Modal */}
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
              <View style={styles.profileAvatarPlaceholder}>
                <Feather name="user" size={40} color="#4ade80" />
              </View>
              <TouchableOpacity style={styles.changePhotoButton}>
                <Feather name="camera" size={14} color="#AAAAAA" />
                <Text style={styles.changePhotoText}>Alterar foto de perfil</Text>
              </TouchableOpacity>
              
              <Text style={styles.profileName}>Leonardo</Text>
              <Text style={styles.profileEmail}>membro@ministerioide.com</Text>
            </View>

            {/* Drawer Menu List */}
            <View style={styles.drawerList}>
              <DrawerMenuItem icon="user" title="Editar Perfil" />
              <View style={styles.drawerDivider} />
              
              <DrawerMenuItem icon="settings" title="Configurações" />
              <View style={styles.drawerDivider} />
              
              <DrawerMenuItem icon="heart" title="Minhas Doações" />
              <View style={styles.drawerDivider} />
              
              <DrawerMenuItem icon="bell" title="Notificações" />
            </View>

            {/* Drawer Footer */}
            <View style={styles.drawerFooter}>
              <DrawerMenuItem icon="log-out" title="Sair do aplicativo" isDestructive={true} />
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 10, 0.75)', // Escurece o background image
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // -- ESTILO FAKE GLASSMORPHISM --
  // Utiliza transparência escura, borda sutil e sombra para criar descolamento
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

  // -- Hero Section --
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
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  heroSubtitle: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 20,
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

  // -- Quick Actions Menu --
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 15,
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
  menuScrollContent: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  menuButton: {
    // Aplicando a mesma lógica de Fake Glass nos cards do menu
    backgroundColor: 'rgba(15, 15, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    width: 100,
    height: 110,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuTitle: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // -- Notices Preview --
  noticeCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  noticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noticeDate: {
    color: '#AAAAAA',
    fontSize: 12,
  },

  // -- Profile Drawer Menu --
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-end', // Alinha o drawer à direita
  },
  drawerContainer: {
    width: width * 0.75, // 75% da tela
    height: '100%',
    backgroundColor: 'rgba(15, 15, 25, 0.95)', // Fundo escuro
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)', // Fake Glass border
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
    fontSize: 15,
    fontWeight: '600',
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
  }
});
