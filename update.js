const fs = require('fs');
const file = 'c:/Users/disci/Desktop/App igreja/app-IDE/src/app/home.tsx';
let content = fs.readFileSync(file, 'utf8');

const returnStart = content.indexOf("  const primeiroNome = userName ? userName.split(' ')[0] : 'Membro';");
if (returnStart !== -1) {
  content = content.substring(0, returnStart) + 
`  const primeiroNome = userName ? userName.split(' ')[0] : 'Membro';

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
            <Text style={styles.meditacaoLabel}>Meditação do dia:</Text>
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
                  <Image source={{ uri: evento.image }} style={styles.eventoImage} />
                  <Text style={styles.eventoTitle}>{evento.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* TabBar Inferior Customizada */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBarLeft}>
          <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
            <Feather name="home" size={24} color="#000000" />
            <Text style={[styles.tabText, { color: '#000000' }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/devocional')}>
            <Feather name="book-open" size={24} color="#666666" />
            <Text style={[styles.tabText, { color: '#666666' }]}>Devocional</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBarRight}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/avisos')}>
            <Feather name="bell" size={24} color="#666666" />
            <Text style={[styles.tabText, { color: '#666666' }]}>Notificações</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => toggleProfileMenu(true)}>
            <Feather name="user" size={24} color="#666666" />
            <Text style={[styles.tabText, { color: '#666666' }]}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botão Flutuante WhatsApp */}
      <TouchableOpacity 
        style={styles.fabWhatsApp}
        onPress={() => Linking.openURL('https://wa.me/').catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp'))}
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
    ...StyleSheet.absoluteFillObject,
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
    width: 140,
    height: 140,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  eventoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 10,
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
    fontSize: 11,
    color: '#000000',
    marginTop: 4,
    fontWeight: '600',
  },
  fabWhatsApp: {
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
    width: 66,
    height: 66,
    borderRadius: 33,
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
`;

  // replace imports
  content = content.replace(
    /import \{\s*StyleSheet,\s*Text,\s*View,\s*ScrollView,\s*StatusBar,\s*ImageBackground,\s*Pressable,\s*Animated,\s*TouchableOpacity,\s*Dimensions,\s*Modal,\s*Image,\s*Alert,\s*ActivityIndicator,\s*\} from 'react-native';/,
    `import {\n  StyleSheet,\n  Text,\n  View,\n  ScrollView,\n  StatusBar,\n  ImageBackground,\n  Pressable,\n  Animated,\n  TouchableOpacity,\n  Dimensions,\n  Modal,\n  Image,\n  Alert,\n  ActivityIndicator,\n  Linking,\n} from 'react-native';`
  );

  // replace menuItems
  content = content.replace(
    /const menuItems = \[[\s\S]*?\];/m,
    `const gridMenu = [
  { id: '1', title: 'Nossa Igreja', icon: 'church', family: 'FontAwesome5', route: '/igreja' },
  { id: '2', title: 'Ministérios', icon: 'fire', family: 'FontAwesome5', route: '/ministerios' },
  { id: '3', title: 'Células', icon: 'user-friends', family: 'FontAwesome5', route: '/celulas' },
  { id: '4', title: 'Eventos', icon: 'calendar', family: 'Feather', route: '/eventos' },
  { id: '5', title: 'Cultos', icon: 'users', family: 'Feather', route: '/cultos' },
  { id: '6', title: 'Devocional', icon: 'book-open', family: 'Feather', route: '/devocional' },
  { id: '7', title: 'Pedidos', icon: 'praying-hands', family: 'FontAwesome5', route: '/pedidos' },
  { id: '8', title: 'Doações', icon: 'hand-holding-heart', family: 'FontAwesome5', route: '/doacoes' },
];

const mockEvents = [
  { id: '1', title: 'Curso de Libras', image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=300&auto=format&fit=crop' },
  { id: '2', title: 'Oração das mães', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop' },
  { id: '3', title: 'Culto kids', image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=300&auto=format&fit=crop' },
];`
  );

  fs.writeFileSync(file, content);
  console.log('Update complete');
} else {
  console.log('Could not find returnStart');
}
