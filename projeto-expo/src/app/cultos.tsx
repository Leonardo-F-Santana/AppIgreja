import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';

export default function ServicesScreen() {
  const router = useRouter();

  const churchLocation = {
    latitude: -22.9105,
    longitude: -43.6268,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleOpenMaps = () => {
    const address = 'Estr. de Paciência, 1258 - Cosmos, Rio de Janeiro';
    const encodedAddress = encodeURIComponent(address);
    
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => console.error('Erro ao abrir o mapa', err));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nossos Cultos</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.welcomeText}>
          Venha adorar a Deus conosco e viver momentos inesquecíveis na presença do Espírito Santo!
        </Text>

        {/* Cards de Programação */}
        <View style={styles.card}>
          <View style={styles.cardInfo}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="home" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Culto da Família</Text>
              <Text style={styles.cardSubtitle}>Quinta-feira</Text>
            </View>
          </View>
          <Text style={styles.cardTime}>19:30h</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardInfo}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="church" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Culto de Celebração</Text>
              <Text style={styles.cardSubtitle}>Domingo</Text>
            </View>
          </View>
          <Text style={styles.cardTime}>19:00h</Text>
        </View>

        {/* Localização */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Nossa Igreja</Text>
          <Text style={styles.addressText}>
            Estr. de Paciência, 1258 - Cosmos, Rio de Janeiro - RJ, 23060-400
          </Text>

          {/* Mapa */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <View style={styles.webMapFallback}>
                <Feather name="map" size={32} color="#FFFFFF" style={{ marginBottom: 10 }} />
                <Text style={styles.webMapText}>Mapa nativo disponível no celular</Text>
              </View>
            ) : (
              <MapView 
                style={styles.map} 
                initialRegion={churchLocation}
              >
                <Marker 
                  coordinate={{ latitude: -22.9105, longitude: -43.6268 }}
                  title="Ministério IDE"
                  description="Nossa Igreja"
                />
              </MapView>
            )}
          </View>

          <TouchableOpacity 
            style={styles.routeButton} 
            activeOpacity={0.8}
            onPress={handleOpenMaps}
          >
            <Feather name="map-pin" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.routeButtonText}>Traçar Rota</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  safeArea: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
    backgroundColor: '#0a0a1a',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  welcomeText: {
    color: '#CCCCCC',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 25,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#A0AEC0',
    fontSize: 14,
  },
  cardTime: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  locationSection: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addressText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webMapFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapText: {
    color: '#A0AEC0',
    fontSize: 14,
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
