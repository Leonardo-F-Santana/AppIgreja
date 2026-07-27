import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock de Dados de Avisos
const notices = [
  {
    id: '1',
    title: 'Acampamento Jovem 2026',
    date: '15 de Agosto',
    description: 'As inscrições para o acampamento de inverno já estão abertas. Procure a liderança ao final do culto para garantir sua vaga.',
    category: 'Jovens',
  },
  {
    id: '2',
    title: 'Culto de Ação de Graças',
    date: 'Domingo, 19:30h',
    description: 'Neste próximo domingo teremos um culto especial de gratidão por tudo que Deus tem feito no nosso ministério.',
    category: 'Geral',
  },
  {
    id: '3',
    title: 'EBD Kids - Nova Turma',
    date: 'Próxima Terça',
    description: 'Estaremos iniciando uma nova classe para crianças de 4 a 7 anos durante a Escola Bíblica.',
    category: 'Infantil',
  },
];

export default function AvisosScreen() {
  const router = useRouter();

  // Funções auxiliares para colorir as tags baseadas na categoria
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Jovens': return 'rgba(255, 107, 107, 0.15)'; 
      case 'Infantil': return 'rgba(74, 222, 128, 0.15)'; 
      default: return 'rgba(255, 255, 255, 0.1)'; 
    }
  };

  const getCategoryTextColor = (category) => {
    switch (category) {
      case 'Jovens': return '#FF6B6B';
      case 'Infantil': return '#4ade80';
      default: return '#E2E8F0';
    }
  };

  const handleWhatsAppContact = () => {
    // TODO: Inserir o número oficial da secretaria no código.
    const phone = '55DDD9XXXXYYYY';
    const text = 'Olá! Estava vendo o mural de avisos no app do Ministério IDE e fiquei com uma dúvida.';
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
    
    Linking.openURL(url).catch(() => {
      console.log('Não foi possível abrir o WhatsApp');
    });
  };

  const renderNotice = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDate}>{item.date}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={[styles.tagText, { color: getCategoryTextColor(item.category) }]}>
            {item.category}
          </Text>
        </View>
      </View>
      <Text style={styles.cardDescription}>{item.description}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0a0a1a', '#050B14']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mural de Avisos</Text>
          <View style={{ width: 34 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.pageSubtitle}>
            Fique por dentro de tudo que está acontecendo na nossa comunidade.
          </Text>

          <FlatList
            data={notices}
            keyExtractor={(item) => item.id}
            renderItem={renderNotice}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>

        {/* Floating Action Button (FAB) - WhatsApp */}
        <TouchableOpacity 
          style={styles.fab} 
          activeOpacity={0.8}
          onPress={handleWhatsAppContact}
        >
          <FontAwesome5 name="whatsapp" size={28} color="#25D366" />
        </TouchableOpacity>
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
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 80, // Aumentado para o FAB não cobrir o último item
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDate: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardDescription: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 211, 102, 0.15)', // Fundo translúcido do WhatsApp estilo Antigravity
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 100,
  },
});
