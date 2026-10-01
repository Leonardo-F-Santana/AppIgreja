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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 15;
const ITEM_WIDTH = (width - SPACING * 3) / COLUMN_COUNT;

const mockGallery = [
  { id: '0', source: require('../../assets/Img/M0.jpg') },
  { id: '1', source: require('../../assets/Img/M1.jpg') },
  { id: '2', source: require('../../assets/Img/M2.jpg') },
  { id: '3', source: require('../../assets/Img/M3.jpeg') },
  { id: '4', source: require('../../assets/Img/M4.jpeg') },
  { id: '5', source: require('../../assets/Img/M5.jpg') },
  { id: '6', source: require('../../assets/Img/M6.jpeg') },
  { id: '7', source: require('../../assets/Img/M7.jpg') },
  { id: '8', source: require('../../assets/Img/M8.jpg') },
  { id: '9', source: require('../../assets/Img/M9.jpeg') },
];

export default function MidiasScreen() {
  const router = useRouter();
  const [imagemExpandida, setImagemExpandida] = useState<any>(null);

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

      <FlatList
        data={mockGallery}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={renderHeader}
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

      {/* Modal Lightbox */}
      <Modal animationType="fade" transparent={true} visible={!!imagemExpandida}>
        <View style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setImagemExpandida(null)}
          >
            <Feather name="x" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={imagemExpandida}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
