import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
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

interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  /**
   * O admin-web grava `dataHora` como string ISO ("YYYY-MM-DDTHH:MM").
   * Por segurança, o tipo aceita também Timestamp do Firestore.
   */
  dataHora: string | Timestamp;
  local: string;
  criadoEm: Timestamp | null;
}

// ─── Helpers de Data ──────────────────────────────────────────────────────────

/**
 * Normaliza o campo `dataHora` para um objeto Date JavaScript,
 * independentemente de vir como string ISO ou Timestamp do Firestore.
 */
function toDate(dataHora: string | Timestamp): Date {
  if (dataHora instanceof Timestamp) {
    return dataHora.toDate();
  }
  // String ISO: "YYYY-MM-DDTHH:MM" — Date() aceita directamente
  const d = new Date(dataHora);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/** Retorna o número do dia (ex: "15") */
function getDia(dataHora: string | Timestamp): string {
  return String(toDate(dataHora).getDate()).padStart(2, '0');
}

/** Retorna a abreviatura do mês em pt-BR maiúsculas (ex: "AGO") */
function getMes(dataHora: string | Timestamp): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(toDate(dataHora))
    .replace('.', '')
    .toUpperCase();
}

/** Retorna a hora formatada (ex: "19:00") */
function getHora(dataHora: string | Timestamp): string {
  const d = toDate(dataHora);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Retorna o nome completo do dia da semana (ex: "Domingo") */
function getDiaSemana(dataHora: string | Timestamp): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
    .format(toDate(dataHora));
}

/** Verifica se o evento já aconteceu */
function eventoJaPassou(dataHora: string | Timestamp): boolean {
  return toDate(dataHora).getTime() < Date.now();
}

// ─── Componente: Card de Evento ───────────────────────────────────────────────

interface EventoCardProps {
  evento: Evento;
  passou: boolean;
}

function EventoCard({ evento, passou }: EventoCardProps) {
  const dia = getDia(evento.dataHora);
  const mes = getMes(evento.dataHora);
  const hora = getHora(evento.dataHora);
  const diaSemana = getDiaSemana(evento.dataHora);

  return (
    <View style={[styles.card, passou && styles.cardPast]}>
      {/* Bloco de Data — estilo folha de calendário */}
      <View style={[styles.dateBlock, passou && styles.dateBlockPast]}>
        <ThemedText style={[styles.dateMes, passou && styles.dateMesPast]}>
          {mes}
        </ThemedText>
        <ThemedText style={[styles.dateDia, passou && styles.dateDiaPast]}>
          {dia}
        </ThemedText>
        <View style={[styles.dateDivider, passou && styles.dateDividerPast]} />
        <ThemedText style={[styles.dateHora, passou && styles.dateHoraPast]}>
          {hora}
        </ThemedText>
      </View>

      {/* Separador vertical */}
      <View style={[styles.verticalSeparator, passou && styles.verticalSeparatorPast]} />

      {/* Conteúdo direito */}
      <View style={styles.cardContent}>
        {/* Dia da semana */}
        <ThemedText style={[styles.diaSemana, passou && styles.diaSemanasPast]}>
          {passou ? `${diaSemana} · Realizado` : diaSemana}
        </ThemedText>

        {/* Título */}
        <ThemedText
          style={[styles.titulo, passou && styles.tituloPast]}
          numberOfLines={2}
        >
          {evento.titulo}
        </ThemedText>

        {/* Local */}
        {evento.local ? (
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={passou ? '#555555' : '#4ade80'}
            />
            <ThemedText
              style={[styles.infoText, passou && styles.infoTextPast]}
              numberOfLines={1}
            >
              {evento.local}
            </ThemedText>
          </View>
        ) : null}

        {/* Hora */}
        <View style={styles.infoRow}>
          <Feather
            name="clock"
            size={13}
            color={passou ? '#555555' : '#4ade80'}
          />
          <ThemedText style={[styles.infoText, passou && styles.infoTextPast]}>
            {hora}
          </ThemedText>
        </View>

        {/* Descrição truncada */}
        {evento.descricao ? (
          <ThemedText
            style={[styles.descricao, passou && styles.descricaoPast]}
            numberOfLines={2}
          >
            {evento.descricao}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

// ─── Componente: Estado Vazio ─────────────────────────────────────────────────

function EmptyState({ tab }: { tab: 'proximos' | 'anteriores' }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Feather name="calendar" size={36} color="#4A5568" />
      </View>
      <ThemedText style={styles.emptyTitle}>
        {tab === 'proximos'
          ? 'Nenhum evento agendado'
          : 'Sem eventos anteriores'}
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {tab === 'proximos'
          ? 'Não há eventos agendados de momento.\nFique atento às novidades!'
          : 'Os eventos realizados aparecerão aqui.'}
      </ThemedText>
    </View>
  );
}

// ─── Ecrã Principal ───────────────────────────────────────────────────────────

type Tab = 'proximos' | 'anteriores';

export default function EventsScreen() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('proximos');

  // ── Subscrição em tempo real ao Firestore ──
  useEffect(() => {
    const q = query(
      collection(db, 'eventos'),
      orderBy('dataHora', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dados: Evento[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            titulo: d.titulo ?? '',
            descricao: d.descricao ?? '',
            dataHora: d.dataHora ?? '',
            local: d.local ?? '',
            criadoEm: d.criadoEm ?? null,
          };
        });
        setEventos(dados);
        setLoading(false);
      },
      (error) => {
        console.error('[EventsScreen] Erro ao escutar eventos:', error.message);
        setLoading(false);
      }
    );

    // Cleanup: cancela subscrição ao desmontar
    return () => unsubscribe();
  }, []);

  // ── Filtro por aba ──
  const eventosFiltrados = eventos.filter((e) => {
    const passou = eventoJaPassou(e.dataHora);
    return activeTab === 'proximos' ? !passou : passou;
  });

  // Contadores para as badges nas abas
  const totalProximos = eventos.filter((e) => !eventoJaPassou(e.dataHora)).length;
  const totalAnteriores = eventos.filter((e) => eventoJaPassou(e.dataHora)).length;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Evento>) => (
      <EventoCard evento={item} passou={eventoJaPassou(item.dataHora)} />
    ),
    []
  );

  const keyExtractor = useCallback((item: Evento) => item.id, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Agenda de Eventos</ThemedText>
          {/* Indicador de tempo real */}
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
          </View>
        </View>
      </SafeAreaView>

      {/* Abas Próximos / Anteriores */}
      <View style={styles.tabContainer}>
        {([
          { key: 'proximos' as Tab, label: 'Próximos', count: totalProximos },
          { key: 'anteriores' as Tab, label: 'Anteriores', count: totalAnteriores },
        ]).map(({ key, label, count }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabButton, activeTab === key && styles.activeTabButton]}
            onPress={() => setActiveTab(key)}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.tabText, activeTab === key && styles.activeTabText]}
            >
              {label}
            </ThemedText>
            {count > 0 && (
              <View style={[
                styles.tabBadge,
                activeTab === key ? styles.tabBadgeActive : styles.tabBadgeInactive,
              ]}>
                <ThemedText style={[
                  styles.tabBadgeText,
                  activeTab === key && styles.tabBadgeTextActive,
                ]}>
                  {count}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Conteúdo */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ade80" />
          <ThemedText style={styles.loadingText}>Carregando agenda...</ThemedText>
        </View>
      ) : (
        <FlatList<Evento>
          data={eventosFiltrados}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            eventosFiltrados.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState tab={activeTab} />}
        />
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const VERDE = '#4ade80';
const VERDE_DIM = 'rgba(74, 222, 128, 0.15)';
const VERDE_BORDER = 'rgba(74, 222, 128, 0.25)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  safeArea: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    backgroundColor: '#0a0a1a',
    zIndex: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
    width: 38,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  liveIndicator: {
    width: 38,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: VERDE,
  },

  // Abas
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: VERDE_DIM,
  },
  tabText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: VERDE,
  },
  tabBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: VERDE_BORDER,
  },
  tabBadgeInactive: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#555555',
  },
  tabBadgeTextActive: {
    color: VERDE,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },

  // Lista
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Empty State
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

  // Card base
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },
  cardPast: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // Bloco de data (esquerda)
  dateBlock: {
    width: 70,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VERDE_DIM,
    gap: 2,
  },
  dateBlockPast: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dateMes: {
    color: VERDE,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dateMesPast: {
    color: '#555555',
  },
  dateDia: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  dateDiaPast: {
    color: '#444444',
  },
  dateDivider: {
    width: 24,
    height: 1,
    backgroundColor: VERDE_BORDER,
    marginVertical: 4,
  },
  dateDividerPast: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  dateHora: {
    color: VERDE,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateHoraPast: {
    color: '#555555',
  },

  // Separador vertical entre bloco de data e conteúdo
  verticalSeparator: {
    width: 1,
    backgroundColor: VERDE_BORDER,
    marginVertical: 14,
  },
  verticalSeparatorPast: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Conteúdo direito do card
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    gap: 4,
  },
  diaSemana: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  diaSemanasPast: {
    color: '#444444',
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 21,
    marginBottom: 6,
  },
  tituloPast: {
    color: '#555555',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  infoTextPast: {
    color: '#444444',
  },
  descricao: {
    color: '#718096',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  descricaoPast: {
    color: '#3A3A3A',
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
});
