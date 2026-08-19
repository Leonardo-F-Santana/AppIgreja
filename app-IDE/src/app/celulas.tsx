import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Linking,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
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

interface Celula {
  id: string;
  nome: string;
  lider: string;
  whatsappLider?: string;
  diaSemana: string;
  horario: string;
  endereco: string;
  bairro: string;
  criadoEm: Timestamp | null;
}

// ─── Paleta de cores cíclica para os avatares ─────────────────────────────────

const PALETA = [
  { fundo: 'rgba(74, 222, 128, 0.15)',  borda: 'rgba(74, 222, 128, 0.35)',  texto: '#4ade80' },
  { fundo: 'rgba(99, 179, 237, 0.15)',  borda: 'rgba(99, 179, 237, 0.35)',  texto: '#63b3ed' },
  { fundo: 'rgba(197, 140, 255, 0.15)', borda: 'rgba(197, 140, 255, 0.35)', texto: '#c58cff' },
  { fundo: 'rgba(251, 191, 36, 0.15)',  borda: 'rgba(251, 191, 36, 0.35)',  texto: '#fbbf24' },
  { fundo: 'rgba(251, 113, 133, 0.15)', borda: 'rgba(251, 113, 133, 0.35)', texto: '#fb7185' },
  { fundo: 'rgba(45, 212, 191, 0.15)',  borda: 'rgba(45, 212, 191, 0.35)',  texto: '#2dd4bf' },
];

function getCor(index: number) {
  return PALETA[index % PALETA.length];
}

/** Extrai as iniciais de até 2 palavras do nome da célula */
function getIniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ─── Componente: Card de Célula ───────────────────────────────────────────────

interface CelulaCardProps {
  celula: Celula;
  corIndex: number;
}

function CelulaCard({ celula, corIndex }: CelulaCardProps) {
  const cor = getCor(corIndex);
  const iniciais = getIniciais(celula.nome);

  const handleWhatsApp = () => {
    if (!celula.whatsappLider) {
      Alert.alert("Atenção", "O número do líder ainda não foi cadastrado.");
      return;
    }

    const apenasNumeros = celula.whatsappLider.replace(/\D/g, '');
    const numeroFormatado = (apenasNumeros.length === 10 || apenasNumeros.length === 11) 
      ? `55${apenasNumeros}` 
      : apenasNumeros;

    Linking.openURL(`whatsapp://send?phone=${numeroFormatado}`).catch(() => {
      Alert.alert('Atenção', 'Não foi possível abrir o WhatsApp. Certifique-se de que o aplicativo está instalado.');
    });
  };

  const handleVerMapa = () => {
    const endereco = encodeURIComponent(
      `${celula.endereco || celula.bairro}`
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${endereco}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o mapa.')
    );
  };

  return (
    <View style={styles.card}>
      {/* Cabeçalho: Avatar + Nome + Bairro */}
      <View style={styles.cardHeader}>
        {/* Avatar com iniciais colorido */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: cor.fundo, borderColor: cor.borda },
          ]}
        >
          <ThemedText style={[styles.avatarText, { color: cor.texto }]}>
            {iniciais}
          </ThemedText>
        </View>

        <View style={styles.headerInfo}>
          <ThemedText style={styles.nomeCelula} numberOfLines={1}>
            {celula.nome}
          </ThemedText>
          {/* Badge de bairro */}
          <View
            style={[
              styles.bairroBadge,
              { backgroundColor: cor.fundo, borderColor: cor.borda },
            ]}
          >
            <Ionicons name="location-outline" size={11} color={cor.texto} />
            <ThemedText style={[styles.bairroText, { color: cor.texto }]}>
              {celula.bairro}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Linhas de detalhes */}
      <View style={styles.detalhes}>
        {/* Líder */}
        <View style={styles.detalheRow}>
          <View style={styles.iconWrapper}>
            <FontAwesome5 name="user" size={12} color="#718096" />
          </View>
          <ThemedText style={styles.detalheLabel}>Líder: </ThemedText>
          <ThemedText style={styles.detalheValor} numberOfLines={1}>
            {celula.lider}
          </ThemedText>
        </View>

        {/* Dia e Horário */}
        <View style={styles.detalheRow}>
          <View style={styles.iconWrapper}>
            <Feather name="clock" size={12} color="#718096" />
          </View>
          <ThemedText style={styles.detalheLabel}>Horário: </ThemedText>
          <ThemedText style={styles.detalheValor}>
            {celula.diaSemana} às {celula.horario}
          </ThemedText>
        </View>

        {/* Endereço */}
        {celula.endereco ? (
          <View style={styles.detalheRow}>
            <View style={styles.iconWrapper}>
              <Ionicons name="location-outline" size={13} color="#718096" />
            </View>
            <ThemedText style={styles.detalheValor} numberOfLines={2}>
              {celula.endereco}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {/* Rodapé: botões de ação */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.btnSecundario}
          onPress={handleVerMapa}
          activeOpacity={0.75}
        >
          <Ionicons name="map-outline" size={15} color="#A0AEC0" />
          <ThemedText style={styles.btnSecundarioText}>Ver no Mapa</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnParticipar}
          onPress={handleWhatsApp}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="whatsapp" size={16} color="#25D366" />
          <ThemedText style={styles.btnParticiparText}>Participar</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Componente: Estado Vazio ─────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Feather name="users" size={36} color="#4A5568" />
      </View>
      <ThemedText style={styles.emptyTitle}>
        Nenhuma célula registada
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Ainda não existem células registadas.{'\n'}Volte mais tarde para conferir!
      </ThemedText>
    </View>
  );
}

// ─── Ecrã Principal ───────────────────────────────────────────────────────────

export default function CelulasScreen() {
  const router = useRouter();
  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Subscrição em tempo real ao Firestore ──
  useEffect(() => {
    let q;
    try {
      q = query(
        collection(db, 'celulas'),
        orderBy('nome', 'asc')
      );
    } catch (err) {
      console.error('[CelulasScreen] Erro ao construir query:', err);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dados: Celula[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            nome: d.nome ?? '',
            lider: d.lider ?? '',
            whatsappLider: d.whatsappLider ?? '',
            diaSemana: d.diaSemana ?? '',
            horario: d.horario ?? '',
            endereco: d.endereco ?? '',
            bairro: d.bairro ?? '',
            criadoEm: d.criadoEm ?? null,
          };
        });
        setCelulas(dados);
        setLoading(false);
      },
      (error) => {
        console.error('[CelulasScreen] Erro ao escutar células:', error.message);
        Alert.alert(
          'Erro de ligação',
          'Não foi possível carregar as células. Verifique a sua ligação à internet.',
          [{ text: 'OK' }]
        );
        setLoading(false);
      }
    );

    // Cleanup: cancela subscrição ao desmontar
    return () => unsubscribe();
  }, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Celula>) => (
      <CelulaCard celula={item} corIndex={index} />
    ),
    []
  );

  const keyExtractor = useCallback((item: Celula) => item.id, []);

  return (
    <LinearGradient colors={['#0a0a1a', '#050B14']} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Células</ThemedText>
          {/* Indicador de tempo real */}
          <View style={styles.liveWrapper}>
            <View style={styles.liveDot} />
          </View>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.pageSubtitle}>
            Encontre uma célula perto de você e faça parte da nossa família.
          </ThemedText>

          {/* Estado de carregamento */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ade80" />
              <ThemedText style={styles.loadingText}>
                Carregando células...
              </ThemedText>
            </View>
          ) : (
            <FlatList<Celula>
              data={celulas}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContainer,
                celulas.length === 0 && styles.listContainerEmpty,
              ]}
              ListEmptyComponent={<EmptyState />}
            />
          )}
        </View>
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
  liveWrapper: {
    width: 40,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },

  // Conteúdo
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

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#555555',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },

  // Lista
  listContainer: {
    paddingBottom: 100,
  },
  listContainerEmpty: {
    flexGrow: 1,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
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
    color: '#555555',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },

  // Cabeçalho do card
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 14,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  nomeCelula: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  bairroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  bairroText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },

  // Separador
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
  },

  // Detalhes
  detalhes: {
    padding: 16,
    paddingTop: 14,
    gap: 8,
  },
  detalheRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconWrapper: {
    width: 20,
    alignItems: 'center',
    paddingTop: 1,
  },
  detalheLabel: {
    color: '#A0AEC0',
    fontSize: 13,
    fontWeight: '600',
  },
  detalheValor: {
    flex: 1,
    color: '#CBD5E0',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Rodapé do card
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  btnSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  btnSecundarioText: {
    color: '#A0AEC0',
    fontSize: 13,
    fontWeight: '600',
  },
  btnParticipar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
  },
  btnParticiparText: {
    color: '#25D366',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
