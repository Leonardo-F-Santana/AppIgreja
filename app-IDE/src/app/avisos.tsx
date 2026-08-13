import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Linking,
  ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ThemedText } from '../components/themed-text';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  prioridade: 'alta' | 'normal';
  autor: string;
  dataCriacao: Timestamp | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(ts: Timestamp | null): string {
  if (!ts) return '—';
  try {
    const date = ts.toDate();
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    const hora = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} às ${hora}:${min}`;
  } catch {
    return '—';
  }
}

// ─── Componente: Card de Aviso ────────────────────────────────────────────────

interface AvisoCardProps {
  aviso: Aviso;
}

function AvisoCard({ aviso }: AvisoCardProps) {
  const isUrgente = aviso.prioridade === 'alta';

  return (
    <View style={[styles.card, isUrgente && styles.cardUrgente]}>
      {/* Barra lateral de prioridade */}
      <View style={[styles.prioridadeBar, isUrgente ? styles.prioridadeBarUrgente : styles.prioridadeBarNormal]} />

      <View style={styles.cardContent}>
        {/* Topo: Badge de prioridade + data */}
        <View style={styles.cardMeta}>
          <View style={[styles.badge, isUrgente ? styles.badgeUrgente : styles.badgeNormal]}>
            {isUrgente ? (
              <MaterialCommunityIcons name="alert-circle" size={11} color="#FF6B6B" style={{ marginRight: 4 }} />
            ) : (
              <MaterialCommunityIcons name="check-circle" size={11} color="#4ade80" style={{ marginRight: 4 }} />
            )}
            <ThemedText
              style={[styles.badgeText, isUrgente ? styles.badgeTextUrgente : styles.badgeTextNormal]}
            >
              {isUrgente ? 'URGENTE' : 'NORMAL'}
            </ThemedText>
          </View>

          <ThemedText style={styles.cardData}>
            {formatarData(aviso.dataCriacao)}
          </ThemedText>
        </View>

        {/* Título */}
        <ThemedText style={styles.cardTitulo} numberOfLines={2}>
          {aviso.titulo}
        </ThemedText>

        {/* Mensagem */}
        <ThemedText style={styles.cardMensagem}>
          {aviso.mensagem}
        </ThemedText>

        {/* Rodapé: Autor */}
        <View style={styles.cardFooter}>
          <Feather name="user" size={12} color="#718096" />
          <ThemedText style={styles.cardAutor}>
            {aviso.autor}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

// ─── Componente: Estado Vazio ─────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Feather name="bell-off" size={40} color="#4A5568" />
      </View>
      <ThemedText style={styles.emptyTitle}>Sem avisos no momento</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Nenhum aviso publicado de momento.{'\n'}Volte mais tarde para conferir novidades.
      </ThemedText>
    </View>
  );
}

// ─── Ecrã Principal ───────────────────────────────────────────────────────────

export default function AvisosScreen() {
  const router = useRouter();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscrição em tempo real ao Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'avisos'),
      orderBy('dataCriacao', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dados: Aviso[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            titulo: data.titulo ?? '',
            mensagem: data.mensagem ?? '',
            prioridade: data.prioridade ?? 'normal',
            autor: data.autor ?? 'Desconhecido',
            dataCriacao: data.dataCriacao ?? null,
          };
        });
        setAvisos(dados);
        setLoading(false);
      },
      (error) => {
        console.error('[AvisosScreen] Erro ao escutar avisos:', error.message);
        setLoading(false);
      }
    );

    // Cleanup: cancela subscrição ao desmontar o componente
    return () => unsubscribe();
  }, []);

  const handleWhatsAppContact = () => {
    // TODO: Substituir pelo número oficial da secretaria.
    const phone = '55DDD9XXXXYYYY';
    const text = 'Olá! Estava vendo o mural de avisos no app do Ministério IDE e fiquei com uma dúvida.';
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      console.log('Não foi possível abrir o WhatsApp');
    });
  };

  const renderAviso = useCallback(
    ({ item }: ListRenderItemInfo<Aviso>) => <AvisoCard aviso={item} />,
    []
  );

  const keyExtractor = useCallback((item: Aviso) => item.id, []);

  return (
    <LinearGradient colors={['#0a0a1a', '#050B14']} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Mural de Avisos</ThemedText>
          {/* Indicador de tempo real */}
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
          </View>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.pageSubtitle}>
            Fique por dentro de tudo que está acontecendo na nossa comunidade.
          </ThemedText>

          {/* Estado de carregamento */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ade80" />
              <ThemedText style={styles.loadingText}>Carregando avisos...</ThemedText>
            </View>
          ) : (
            <FlatList<Aviso>
              data={avisos}
              keyExtractor={keyExtractor}
              renderItem={renderAviso}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContainer,
                avisos.length === 0 && styles.listContainerEmpty,
              ]}
              ListEmptyComponent={<EmptyState />}
            />
          )}
        </View>

        {/* FAB — WhatsApp */}
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

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  liveIndicator: {
    width: 40,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    // Simula pulso estático; para animação real, usar Animated
  },

  // Conteúdo
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

  // Lista
  listContainer: {
    paddingBottom: 100,
  },
  listContainerEmpty: {
    flexGrow: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  cardUrgente: {
    backgroundColor: 'rgba(255, 107, 107, 0.07)',
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },

  // Barra lateral de prioridade
  prioridadeBar: {
    width: 4,
    flexShrink: 0,
  },
  prioridadeBarNormal: {
    backgroundColor: '#4ade80',
  },
  prioridadeBarUrgente: {
    backgroundColor: '#FF6B6B',
  },

  // Conteúdo do card
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  // Badge de prioridade
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeNormal: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  badgeUrgente: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  badgeTextNormal: {
    color: '#4ade80',
  },
  badgeTextUrgente: {
    color: '#FF6B6B',
  },

  // Dados do card
  cardData: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '500',
  },
  cardTitulo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  cardMensagem: {
    color: '#CBD5E0',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  cardAutor: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
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
