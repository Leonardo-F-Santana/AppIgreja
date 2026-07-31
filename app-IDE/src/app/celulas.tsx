import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock de Dados - Seguindo diretrizes LGPD (apenas primeiro nome e bairro, sem endereço exato)
const cellsData = [
  {
    id: '1',
    leaderName: 'Jeferson e Sheila',
    neighborhood: 'Santa Margarida',
    targetAudience: 'Casais',
    dayTime: 'Terças às 19:30h',
    leaderPhone: '5511999999999', // Fictício
  },
  {
    id: '2',
    leaderName: 'Gerson e Penélope',
    neighborhood: 'Cosmos',
    targetAudience: 'Casais',
    dayTime: 'Terças às 19:30h',
    leaderPhone: '5511999999999',
  },
  {
    id: '3',
    leaderName: 'Pedro',
    neighborhood: 'Inhoaiba',
    targetAudience: 'Jovens',
    dayTime: 'Terças às 19:30h',
    leaderPhone: '5511999999999',
  },
  {
    id: '4',
    leaderName: 'Lucas e Ana',
    neighborhood: 'Paciência',
    targetAudience: 'Misto',
    dayTime: 'Terças às 19:30h',
    leaderPhone: '5511999999999',
  },
  {
    id: '5',
    leaderName: 'Ana',
    neighborhood: 'Cosmos',
    targetAudience: 'Mulheres',
    dayTime: 'Terças às 19:30h',
    leaderPhone: '5511999999999',
  },
];

export default function CelulasScreen() {
  const router = useRouter();

  const handleJoinCell = async (cell) => {
    const text = `Olá! Gostaria de participar da célula em ${cell.neighborhood}.`;
    const url = `whatsapp://send?phone=${cell.leaderPhone}&text=${encodeURIComponent(text)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback caso não tenha WhatsApp instalado
        Alert.alert(
          'WhatsApp não encontrado',
          'Não foi possível abrir o WhatsApp. Verifique se o aplicativo está instalado.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Erro ao tentar abrir WhatsApp:', error);
    }
  };

  const renderCellCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {/* Esquerda: Foto do Líder (Placeholder) */}
        <View style={styles.avatarContainer}>
          <FontAwesome5 name="user-circle" size={38} color="#A0AEC0" solid />
        </View>

        {/* Centro: Informações */}
        <View style={styles.infoContainer}>
          <Text style={styles.leaderName}>{item.leaderName}</Text>

          <View style={styles.infoRow}>
            <Feather name="map-pin" size={12} color="#A0AEC0" />
            <Text style={styles.infoText}>{item.neighborhood}</Text>
          </View>

          <View style={styles.infoRow}>
            <Feather name="users" size={12} color="#A0AEC0" />
            <Text style={styles.infoText}>{item.targetAudience}</Text>
          </View>

          <View style={styles.infoRow}>
            <Feather name="clock" size={12} color="#A0AEC0" />
            <Text style={styles.infoText}>{item.dayTime}</Text>
          </View>
        </View>
      </View>

      {/* Rodapé/Direita: Botão de Participar */}
      <TouchableOpacity
        style={styles.joinButton}
        onPress={() => handleJoinCell(item)}
      >
        <FontAwesome5 name="whatsapp" size={18} color="#25D366" />
        <Text style={styles.joinButtonText}>Participar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0a0a1a', '#050B14']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Células</Text>
          <View style={{ width: 34 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.pageSubtitle}>
            Encontre uma célula perto de você e faça parte da nossa família.
          </Text>

          <FlatList
            data={cellsData}
            keyExtractor={(item) => item.id}
            renderItem={renderCellCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>
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
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
    width: 34,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pageSubtitle: {
    color: '#A0AEC0',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  infoContainer: {
    flex: 1,
  },
  leaderName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    color: '#A0AEC0',
    fontSize: 13,
    marginLeft: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  joinButtonText: {
    color: '#25D366',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
