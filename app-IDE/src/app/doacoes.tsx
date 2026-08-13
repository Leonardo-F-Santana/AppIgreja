import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  FlatList,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';

interface Doacao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  chaveOuConta: string;
  ativo: boolean;
  criadoEm: any;
}

export default function DoacoesScreen() {
  const router = useRouter();

  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'doacoes'),
      where('ativo', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: Doacao[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Doacao));
      
      setDoacoes(lista);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar doações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as campanhas de doação.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const copiarChave = async (id: string, chave: string) => {
    await Clipboard.setStringAsync(chave);
    setCopiedId(id);
    
    // Mostra um toast nativo via Alert (simples) e volta o botão ao normal após 2 segundos
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const renderItem = ({ item }: { item: Doacao }) => {
    const isCopied = copiedId === item.id;
    const isPix = item.tipo.toUpperCase().includes('PIX');

    return (
      <ThemedView style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardTitle} type="title" numberOfLines={2}>
            {item.titulo}
          </ThemedText>
          <View style={[styles.badge, isPix ? styles.badgePix : styles.badgeBank]}>
            <Ionicons 
              name={isPix ? 'qr-code-outline' : 'business-outline'} 
              size={14} 
              color={isPix ? '#047857' : '#1d4ed8'} 
            />
            <Text style={[styles.badgeText, isPix ? styles.badgeTextPix : styles.badgeTextBank]}>
              {isPix ? 'PIX' : 'BANCO'}
            </Text>
          </View>
        </View>
        
        {item.descricao ? (
          <ThemedText style={styles.cardDescription}>{item.descricao}</ThemedText>
        ) : null}

        <View style={styles.keyContainer}>
          <ThemedText style={styles.keyLabel}>
            {isPix ? 'CHAVE PIX' : 'DADOS BANCÁRIOS'}
          </ThemedText>
          <Text style={styles.keyValue} selectable={true}>
            {item.chaveOuConta}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.copyButton, isCopied && styles.copyButtonCopied]}
          onPress={() => copiarChave(item.id, item.chaveOuConta)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isCopied ? "checkmark-circle" : "copy-outline"} 
            size={20} 
            color="#0a0a1a" 
          />
          <Text style={styles.copyButtonText}>
            {isCopied ? 'Copiado!' : 'Copiar Chave'}
          </Text>
        </TouchableOpacity>
      </ThemedView>
    );
  };

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
          <ThemedText style={styles.headerTitle}>Dízimos e Ofertas</ThemedText>
          <View style={{ width: 34 }} />
        </View>

        <ThemedText style={styles.pageDescription}>
          "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria." - 2 Coríntios 9:7
        </ThemedText>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4ade80" />
            <ThemedText style={styles.loadingText}>Carregando campanhas...</ThemedText>
          </View>
        ) : doacoes.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="wallet-outline" size={64} color="rgba(255,255,255,0.2)" />
            <ThemedText style={styles.emptyText}>
              Nenhuma campanha de arrecadação ativa de momento.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={doacoes}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  pageDescription: {
    color: '#A0AEC0',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#A0AEC0',
    fontSize: 16,
  },
  emptyText: {
    marginTop: 16,
    color: '#A0AEC0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 28,
    color: '#F1F5F9', // Cinza quase branco
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgePix: {
    backgroundColor: '#d1fae5',
  },
  badgeBank: {
    backgroundColor: '#dbeafe',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  badgeTextPix: {
    color: '#047857',
  },
  badgeTextBank: {
    color: '#1d4ed8',
  },
  cardDescription: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  keyContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  keyLabel: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  keyValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: '#4ade80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  copyButtonCopied: {
    backgroundColor: '#60a5fa',
  },
  copyButtonText: {
    color: '#0a0a1a',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
