import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
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
        url: imagemExpandida
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

      <View style={styles.socialGrid}>
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: 'rgba(193, 53, 132, 0.15)', borderColor: '#C13584' }]}
          onPress={() => handleOpenLink('https://www.instagram.com/ministerioide.rj/')}
        >
          <FontAwesome5 name="instagram" size={26} color="#C13584" />
          <Text style={[styles.socialText, { color: '#C13584' }]}>Instagram</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: 'rgba(24, 119, 242, 0.15)', borderColor: '#1877F2' }]}
          onPress={() => handleOpenLink('https://www.facebook.com/ministerioiderj/')}
        >
          <FontAwesome5 name="facebook" size={26} color="#1877F2" />
          <Text style={[styles.socialText, { color: '#1877F2' }]}>Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: 'rgba(255, 0, 0, 0.15)', borderColor: '#FF0000' }]}
          onPress={() => handleOpenLink('https://www.youtube.com/@MinisterioIDE_rj')}
        >
          <FontAwesome5 name="youtube" size={26} color="#FF0000" />
          <Text style={[styles.socialText, { color: '#FF0000' }]}>YouTube</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 35, marginBottom: 15 }]}>Nossos Momentos</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Navbar Superior */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Mídias</Text>
        <View style={{ width: 28 }} />
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
              activeOpacity={0.8}
              onPress={() => setAlbumAtivo(item)}
            >
              <Image source={item.cover} style={styles.albumCover} />
              <View style={styles.albumTextContainer}>
                <Text style={styles.albumTitle} numberOfLines={1}>{item.titulo}</Text>
                <Text style={styles.albumCount}>{item.qtd}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.albumHeader}>
            <TouchableOpacity onPress={() => setAlbumAtivo(null)} style={styles.backToAlbumsButton}>
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
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
                activeOpacity={0.8}
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
              <TouchableOpacity onPress={() => setImagemExpandida(null)}>
                <Feather name="x" size={30} color="#FFFFFF" />
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
                <Feather name="share-2" size={20} color="#FFFFFF" />
                <Text style={styles.sharePillText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: SPACING,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 20,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    marginHorizontal: 5,
  },
  socialText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.2, // Proporção levemente retangular para as fotos
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  albumCard: {
    width: ITEM_WIDTH,
    marginBottom: SPACING,
  },
  albumCover: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 12,
    resizeMode: 'cover',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  albumTextContainer: {
    paddingTop: 8,
  },
  albumTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  albumCount: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 2,
  },
  albumHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backToAlbumsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backToAlbumsText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },
  activeAlbumTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
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
  modalFooter: {
    padding: 20,
    alignItems: 'center',
  },
  sharePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  sharePillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  fullImage: {
    width: '100%',
    flex: 1,
  },
});
