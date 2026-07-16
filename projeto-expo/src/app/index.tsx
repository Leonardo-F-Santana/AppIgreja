import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const menuItems = [
  { id: '1', title: 'Igreja', icon: 'church', family: 'FontAwesome5' },
  { id: '2', title: 'Ministérios', icon: 'fire', family: 'FontAwesome5' },
  { id: '3', title: 'Cultos', icon: 'users', family: 'Feather' },
  { id: '4', title: 'Eventos', icon: 'calendar', family: 'Feather' },
  { id: '5', title: 'Células', icon: 'account-group', family: 'MaterialCommunityIcons' },
  { id: '6', title: 'Devocional', icon: 'book-open', family: 'Feather' },
  { id: '7', title: 'Pedidos', icon: 'praying-hands', family: 'FontAwesome5' },
  { id: '8', title: 'Doações', icon: 'hand-holding-heart', family: 'FontAwesome5' },
  { id: '9', title: 'Bíblia', icon: 'bible', family: 'FontAwesome5' },
];

export default function HomeScreen() {
  const router = useRouter();

  const renderIcon = (family, name, size = 24, color = '#FFFFFF') => {
    switch (family) {
      case 'FontAwesome5':
        return <FontAwesome5 name={name} size={size} color={color} />;
      case 'Feather':
        return <Feather name={name} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={name} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={name} size={size} color={color} />;
      default:
        return <Feather name={name} size={size} color={color} />;
    }
  };

  const [currentVerse, setCurrentVerse] = useState(null);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRandomVerse = async () => {
    // Evita carregamento infinito limitando a espera a 4 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      setLoadingVerse(true);
      
      // Usando uma API internacional mais rápida, sem problemas de CORS
      const apiUrl = `https://bible-api.com/?random=verse&translation=almeida&t=${new Date().getTime()}`;
      
      const response = await fetch(apiUrl, { 
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Network response falhou');
      
      const data = await response.json();

      setCurrentVerse({
        text: data.text.trim(),
        reference: data.reference,
      });
    } catch (error) {
      console.log('Erro ao buscar versículo:', error);
      
      // Fallbacks aleatórios para caso a internet caia ou a API falhe
      const fallbacks = [
        { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
        { text: "O Senhor é o meu pastor; de nada terei falta.", reference: "Salmos 23:1" },
        { text: "Entregue o seu caminho ao Senhor; confie nele, e ele o fará.", reference: "Salmos 37:5" },
        { text: "Deixo a paz a vocês; a minha paz dou a vocês.", reference: "João 14:27" },
        { text: "O amor é paciente, o amor é bondoso.", reference: "1 Coríntios 13:4" }
      ];
      
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setCurrentVerse(randomFallback);
    } finally {
      setLoadingVerse(false);
    }
  };

  useEffect(() => {
    fetchRandomVerse();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRandomVerse();
    setRefreshing(false);
  };

  const openSocialApp = async (appUrl, webUrl) => {
    try {
      // Tenta verificar se o celular consegue abrir o link nativo do App (ex: instagram://)
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl); // Abre o App
      } else {
        await Linking.openURL(webUrl); // Fallback: Abre no navegador
      }
    } catch (error) {
      await Linking.openURL(webUrl); // Fallback: Abre no navegador
    }
  };

  return (
    <LinearGradient
      colors={['#050B14', '#0B1A30', '#050B14']}
      style={styles.container}
    >
      <Image
        source={require('../../assets/Img/Bg.jpg')}
        style={styles.backgroundImage}
      />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="settings" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="user" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#0B1A30']}
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoCircle}>
            <View style={styles.logoCircleInner}>
              <Image
                source={require('../../assets/Img/logo.jpg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              {/* NOTA TÉCNICA: Para o efeito transparente perfeito sem fundo marrom, a imagem física 'logo.jpg' deve ser convertida previamente em um PNG com fundo transparente. O overflow: 'hidden' no container tenta mascarar as bordas por enquanto. */}
            </View>
          </View>
          <Text style={styles.logoText}>Ministério IDE</Text>
          <Text style={styles.subtitleText}>
            Identidade, Discipulado, Envio.{'\n'} Uma família de muitos filhos semelhantes à Jesus!
          </Text>
        </View>

        {/* Versicle Banner */}
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerTitle}>VERSÍCULO DO DIA</Text>
          {loadingVerse && !refreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 10 }} />
          ) : (
            <>
              <Text style={styles.bannerText}>
                "{currentVerse?.text}"
              </Text>
              <Text style={styles.bannerReference}>{currentVerse?.reference}</Text>
            </>
          )}
        </View>

        {/* Main Menu Grid */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => {
                if (item.title === 'Igreja') {
                  router.push('/igreja');
                } else if (item.title === 'Ministérios') {
                  router.push('/ministerios');
                } else if (item.title === 'Cultos') {
                  router.push('/cultos');
                }
              }}
            >
              <View style={styles.menuIconButton}>
                {renderIcon(item.family, item.icon, 26)}
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer (Social Media) */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openSocialApp('instagram://user?username=ministerioide.rj', 'https://www.instagram.com/ministerioide.rj/')}
          >
            <Feather name="instagram" size={22} color="#CCCCCC" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openSocialApp('vnd.youtube://www.youtube.com/@MinisterioIDE_rj', 'https://www.youtube.com/@MinisterioIDE_rj')}
          >
            <Feather name="youtube" size={22} color="#CCCCCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.15, // Aumentado de 0.05 para 0.15 para ficar mais visível
  },
  safeArea: {
    // Ensures space for the status bar on both iOS and Android if not handled perfectly by SafeAreaView
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 35,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  logoCircleInner: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Mascara bordas quadradas de imagens sem transparência
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitleText: {
    color: '#A0AEC0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bannerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bannerTitle: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 10,
  },
  bannerReference: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 30,
  },
  menuIconButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
  },
  socialButton: {
    width: 48,
    height: 48,
    marginHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
});
