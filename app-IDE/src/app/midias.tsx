import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Linking,
  StatusBar,
  Dimensions,
  Modal,
  Share,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 15;
const ITEM_WIDTH = (width - SPACING * 3) / COLUMN_COUNT;

const albunsMock = [
  {
    id: '1',
    titulo: 'Culto de Celebração',
    qtd: '5 fotos',
    cover: require('../../assets/Img/M0.jpg'),
    fotos: [
      { id: '101', source: require('../../assets/Img/M0.jpg') },
      { id: '102', source: require('../../assets/Img/M1.jpg') },
      { id: '103', source: require('../../assets/Img/M2.jpg') },
      { id: '104', source: require('../../assets/Img/M3.jpeg') },
      { id: '105', source: require('../../assets/Img/M4.jpeg') },
    ],
  },
  {
    id: '2',
    titulo: 'Retiro Espiritual',
    qtd: '5 fotos',
    cover: require('../../assets/Img/M5.jpg'),
    fotos: [
      { id: '106', source: require('../../assets/Img/M5.jpg') },
      { id: '107', source: require('../../assets/Img/M6.jpeg') },
      { id: '108', source: require('../../assets/Img/M7.jpg') },
      { id: '109', source: require('../../assets/Img/M8.jpg') },
      { id: '110', source: require('../../assets/Img/M9.jpeg') },
    ],
  },
];

export default function MidiasScreen() {
  const router = useRouter();
  const [imagemExpandida, setImagemExpandida] = useState<any>(null);
  const [albumAtivo, setAlbumAtivo] = useState<any>(null);

  const compartilharImagem = async () => {
    if (!imagemExpandida) return;
    try {
      await Share.share({
        message: 'Veja este momento da nossa igreja! ⛪ ' + imagemExpandida,
        url: imagemExpandida,
      });
    } catch (error) {
      // Falhas ou cancelamentos ignorados silenciosamente
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      console.log('Erro ao abrir link');
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.sectionTitle}>Siga Nossas Redes</Text>
      <Text style={styles.sectionSubtitle}>Acompanhe a nossa igreja de perto</Text>

      {/* 4 Botões em Linha (Row) - Vibrant App Icons */}
      <View style={styles.socialRow}>
        {/* Instagram - Gradiente Oficial Vibrante */}
        <TouchableOpacity
          style={styles.socialCard}
          activeOpacity={0.8}
          onPress={() => handleOpenLink('https://www.instagram.com/ministerioide.rj/')}
        >
          <LinearGradient
            colors={['#833AB4', '#E1306C', '#FD1D1D', '#F77737']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.socialCardContent}
          >
            <FontAwesome5 name="instagram" size={24} color="#FFFFFF" />
            <Text style={styles.socialCardTitle} numberOfLines={1}>Instagram</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Facebook - Azul Vibrante Oficial */}
        <TouchableOpacity
          style={styles.socialCard}
          activeOpacity={0.8}
          onPress={() => handleOpenLink('https://www.facebook.com/ministerioiderj/')}
        >
          <LinearGradient
            colors={['#1877F2', '#0C63D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.socialCardContent}
          >
            <FontAwesome5 name="facebook-f" size={24} color="#FFFFFF" />
            <Text style={styles.socialCardTitle} numberOfLines={1}>Facebook</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* YouTube - Vermelho Vivo Oficial */}
        <TouchableOpacity
          style={styles.socialCard}
          activeOpacity={0.8}
          onPress={() => handleOpenLink('https://www.youtube.com/@MinisterioIDE_rj')}
        >
          <LinearGradient
            colors={['#FF0000', '#CC0000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.socialCardContent}
          >
            <FontAwesome5 name="youtube" size={24} color="#FFFFFF" />
            <Text style={styles.socialCardTitle} numberOfLines={1}>YouTube</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* TikTok - Gradiente Escuro com Tons Verde-Água/Rosa */}
        <TouchableOpacity
          style={[styles.socialCard, { borderWidth: 1, borderColor: 'rgba(0, 242, 254, 0.35)' }]}
          activeOpacity={0.8}
          onPress={() => handleOpenLink('https://www.tiktok.com/@ministerio.ide_?_r=1&_t=ZS-9AZn66nlx1I')}
        >
          <LinearGradient
            colors={['#121926', '#1E1428', '#0D0E15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.socialCardContent}
          >
            <FontAwesome5 name="tiktok" size={22} color="#FFFFFF" />
            <Text style={styles.socialCardTitle} numberOfLines={1}>TikTok</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 32, marginBottom: 16 }]}>Nossos Momentos</Text>
    </View>
  );

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ─── Elementos de Luz Neon Glow no Fundo ────────────────────────── */}
      <View
        pointerEvents="none"
        style={styles.glowOrbTopRight}
      >
        <LinearGradient
          colors={['rgba(224, 36, 165, 0.42)', 'rgba(192, 38, 211, 0.15)', 'transparent']}
          style={styles.glowGradient}
        />
      </View>

      <View
        pointerEvents="none"
        style={styles.glowOrbBottomLeft}
      >
        <LinearGradient
          colors={['rgba(37, 99, 235, 0.4)', 'rgba(99, 102, 241, 0.18)', 'transparent']}
          style={styles.glowGradient}
        />
      </View>

      <View
        pointerEvents="none"
        style={styles.glowOrbCenter}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.32)', 'rgba(168, 85, 247, 0.1)', 'transparent']}
          style={styles.glowGradient}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Navbar Superior */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Mídias</Text>
          <View style={{ width: 40 }} />
        </View>

        {!albumAtivo ? (
          <FlatList
            data={albunsMock}
            keyExtractor={(item) => item.id}
            numColumns={COLUMN_COUNT}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.albumCard}
                activeOpacity={0.85}
                onPress={() => setAlbumAtivo(item)}
              >
                {/* Imagem de Capa Edge-to-Edge */}
                <Image source={item.cover} style={styles.albumCover} resizeMode="cover" />

                {/* Fade Degradê para Legibilidade do Texto */}
                <LinearGradient
                  colors={['transparent', 'rgba(15, 12, 41, 0.45)', 'rgba(15, 12, 41, 0.95)']}
                  locations={[0, 0.45, 1]}
                  style={styles.albumFadeGradient}
                >
                  <View style={styles.albumTextContainer}>
                    <Text style={styles.albumTitle} numberOfLines={2}>
                      {item.titulo}
                    </Text>
                    <View style={styles.albumBadgeRow}>
                      <View style={styles.albumBadge}>
                        <Feather name="image" size={11} color="#CBD5E1" style={{ marginRight: 4 }} />
                        <Text style={styles.albumCount}>{item.qtd}</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.albumHeader}>
              <TouchableOpacity onPress={() => setAlbumAtivo(null)} style={styles.backToAlbumsButton}>
                <View style={styles.backButtonMini}>
                  <Feather name="arrow-left" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.backToAlbumsText}>Voltar para Álbuns</Text>
              </TouchableOpacity>
              <Text style={styles.activeAlbumTitle}>{albumAtivo.titulo}</Text>
            </View>
            <FlatList
              data={albumAtivo.fotos}
              keyExtractor={(item) => item.id}
              numColumns={COLUMN_COUNT}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.imageContainer}
                  activeOpacity={0.85}
                  onPress={() => setImagemExpandida(item.source)}
                >
                  <Image
                    source={item.source as any}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Modal Lightbox */}
        <Modal animationType="fade" transparent={true} visible={!!imagemExpandida}>
          <TouchableOpacity
            style={styles.modalRoot}
            activeOpacity={1}
            onPress={() => setImagemExpandida(null)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              {/* Header (Topo) */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setImagemExpandida(null)} style={styles.closeModalButton}>
                  <Feather name="x" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Área da Imagem (Meio) */}
              <TouchableWithoutFeedback>
                <Image
                  source={imagemExpandida}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </TouchableWithoutFeedback>

              {/* Footer (Base) */}
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.sharePillButton} onPress={compartilharImagem}>
                  <Feather name="share-2" size={18} color="#FFFFFF" />
                  <Text style={styles.sharePillText}>Compartilhar</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F0C29',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrbTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 290,
    height: 290,
    borderRadius: 145,
    opacity: 0.45,
    overflow: 'hidden',
  },
  glowOrbBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.4,
    overflow: 'hidden',
  },
  glowOrbCenter: {
    position: 'absolute',
    top: '42%',
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.35,
    overflow: 'hidden',
  },
  glowGradient: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: SPACING,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  socialCard: {
    width: 75,
    height: 85,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  socialCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  socialCardTitle: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING,
  },
  albumCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.34,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  albumCover: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  albumFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  albumTextContainer: {},
  albumTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  albumBadgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  albumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  albumCount: {
    fontSize: 11,
    color: '#F1F5F9',
    fontWeight: '600',
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.25,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  albumHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  backToAlbumsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backToAlbumsText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  activeAlbumTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  modalSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
  closeModalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    padding: 20,
    alignItems: 'center',
  },
  sharePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  sharePillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  fullImage: {
    width: '100%',
    flex: 1,
  },
});
