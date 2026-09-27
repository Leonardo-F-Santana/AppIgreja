import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Platform,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collectionGroup,
  query,
  where,
  getDocs,
  getDoc,
  collection,
  orderBy,
  onSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Turma {
  id: string;
  nome: string;
  professor: string;
  diaHorario: string;
  status: 'ativa' | 'encerrada';
}

interface ChamadaAluno {
  alunoId: string;
  nome: string;
  presente: boolean;
  nota: number | null;
}

interface Aula {
  id: string;
  data: string;
  tema: string;
  chamada: ChamadaAluno[];
  criadoEm?: Timestamp | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatarData(dataISO: string): string {
  if (!dataISO) return '—';
  const parts = dataISO.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataISO;
}

// ─── Cores temáticas por turma ──────────────────────────────────────────────

const CORES_TURMA = [
  { accent: '#60A5FA', bg: 'rgba(96, 165, 250, 0.12)', border: 'rgba(96, 165, 250, 0.25)' },
  { accent: '#A78BFA', bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.25)' },
  { accent: '#34D399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.25)' },
  { accent: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.25)' },
  { accent: '#FB7185', bg: 'rgba(251, 113, 133, 0.12)', border: 'rgba(251, 113, 133, 0.25)' },
  { accent: '#2DD4BF', bg: 'rgba(45, 212, 191, 0.12)', border: 'rgba(45, 212, 191, 0.25)' },
];

// ═════════════════════════════════════════════════════════════════════════════
// TELA PRINCIPAL: LISTA DE TURMAS
// ═════════════════════════════════════════════════════════════════════════════

export default function EscolasScreen() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunoDocIds, setAlunoDocIds] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);

  useEffect(() => {
    async function fetchMinhasTurmas() {
      try {
        const user = auth.currentUser;
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Busca em todas as subcoleções "alunos" onde o membroId é o usuário atual
        const alunosQuery = query(
          collectionGroup(db, 'alunos'),
          where('membroId', '==', user.uid)
        );

        const alunosSnapshot = await getDocs(alunosQuery);
        
        if (alunosSnapshot.empty) {
          setTurmas([]);
          setIsLoading(false);
          return;
        }

        const turmasEncontradas: Turma[] = [];
        const turmasIds = new Set<string>();
        const alunoIds: Record<string, string> = {};

        for (const alunoDoc of alunosSnapshot.docs) {
          const turmaRef = alunoDoc.ref.parent.parent;
          
          if (turmaRef && !turmasIds.has(turmaRef.id)) {
            turmasIds.add(turmaRef.id);
            alunoIds[turmaRef.id] = alunoDoc.id;
            const turmaDoc = await getDoc(turmaRef);
            
            if (turmaDoc.exists()) {
              const data = turmaDoc.data();
              turmasEncontradas.push({
                id: turmaDoc.id,
                nome: data.nome || 'Turma sem nome',
                professor: data.professor || 'Não informado',
                diaHorario: data.diaHorario || 'Não definido',
                status: data.status || 'ativa',
              });
            }
          }
        }

        setTurmas(turmasEncontradas);
        setAlunoDocIds(alunoIds);
      } catch (error) {
        console.error('Erro ao buscar turmas do aluno:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMinhasTurmas();
  }, []);

  // Se uma turma foi selecionada, renderiza a tela de detalhes
  if (selectedTurma) {
    return (
      <TurmaDetalhesScreen
        turma={selectedTurma}
        alunoDocId={alunoDocIds[selectedTurma.id]}
        corIndex={turmas.findIndex(t => t.id === selectedTurma.id)}
        onVoltar={() => setSelectedTurma(null)}
      />
    );
  }

  const renderTurmaCard = ({ item, index }: { item: Turma; index: number }) => {
    const cor = CORES_TURMA[index % CORES_TURMA.length];
    const isAtiva = item.status === 'ativa';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelectedTurma(item)}
        style={[styles.card, { borderColor: cor.border }]}
      >
        {/* Indicador de cor lateral */}
        <View style={[styles.cardAccentBar, { backgroundColor: cor.accent }]} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: cor.bg }]}>
              <FontAwesome5 name="book-reader" size={20} color={cor.accent} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.nome}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isAtiva ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.15)' }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isAtiva ? '#34D399' : '#94A3B8' }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: isAtiva ? '#34D399' : '#94A3B8' }
                ]}>
                  {isAtiva ? 'Ativa' : 'Encerrada'}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Feather name="user" size={14} color="#94A3B8" />
              <Text style={styles.detailText}>Prof. {item.professor}</Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="clock" size={14} color="#94A3B8" />
              <Text style={styles.detailText}>{item.diaHorario}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconCircle}>
        <FontAwesome5 name="graduation-cap" size={48} color="#475569" />
      </View>
      <Text style={styles.emptyStateTitle}>Nenhuma Matrícula</Text>
      <Text style={styles.emptyStateDesc}>
        Você ainda não está inscrito em nenhuma escola ou turma. Entre em contato com a secretaria da igreja para se matricular.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Escolas</Text>
        <View style={{ width: 40 }} />
      </View>

      <LinearGradient
        colors={['#0F0F19', '#1A1A2E']}
        style={styles.gradientContainer}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#60A5FA" />
            <Text style={styles.loadingText}>Buscando turmas...</Text>
          </View>
        ) : (
          <FlatList
            data={turmas}
            keyExtractor={(item) => item.id}
            renderItem={renderTurmaCard}
            contentContainerStyle={
              turmas.length === 0 ? styles.listContentEmpty : styles.listContent
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TELA DE DETALHES DA TURMA (para o aluno)
// ═════════════════════════════════════════════════════════════════════════════

interface TurmaDetalhesProps {
  turma: Turma;
  alunoDocId?: string;
  corIndex: number;
  onVoltar: () => void;
}

function TurmaDetalhesScreen({ turma, alunoDocId, corIndex, onVoltar }: TurmaDetalhesProps) {
  const cor = CORES_TURMA[Math.max(0, corIndex) % CORES_TURMA.length];
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [carregandoAulas, setCarregandoAulas] = useState(true);
  const [aulaExpandida, setAulaExpandida] = useState<string | null>(null);

  // Busca as aulas registradas pelo professor na subcoleção turmas/{turmaId}/aulas
  useEffect(() => {
    const aulasRef = collection(db, 'turmas', turma.id, 'aulas');
    const q = query(aulasRef, orderBy('criadoEm', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            data: data.data || '',
            tema: data.tema || '',
            chamada: data.chamada || [],
            criadoEm: data.criadoEm || null,
          } as Aula;
        });
        setAulas(lista);
        setCarregandoAulas(false);
      },
      (error) => {
        console.error('Erro ao buscar aulas:', error.message);
        // Fallback sem ordenação caso não exista o índice
        if (error.message.includes('index')) {
          const fallbackQ = query(aulasRef);
          onSnapshot(fallbackQ, (snap) => {
            const lista = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                data: data.data || '',
                tema: data.tema || '',
                chamada: data.chamada || [],
                criadoEm: data.criadoEm || null,
              } as Aula;
            });
            setAulas(lista);
            setCarregandoAulas(false);
          });
        } else {
          setAulas([]);
          setCarregandoAulas(false);
        }
      },
    );
    return () => unsubscribe();
  }, [turma.id]);

  // Calcula o desempenho geral do aluno
  const user = auth.currentUser;
  const meuDesempenho = useCallback(() => {
    if (!user || !alunoDocId) return { presencas: 0, faltas: 0, totalAulas: 0, mediaNota: null as number | null };
    
    let presencas = 0;
    let faltas = 0;
    let somaNotas = 0;
    let qtdNotas = 0;

    aulas.forEach((aula) => {
      const registro = aula.chamada?.find((c) => c.alunoId === alunoDocId);
      if (registro) {
        if (registro.presente) presencas++;
        else faltas++;
        if (registro.nota !== null && registro.nota !== undefined) {
          somaNotas += Number(registro.nota);
          qtdNotas++;
        }
      }
    });

    return {
      presencas,
      faltas,
      totalAulas: aulas.length,
      mediaNota: qtdNotas > 0 ? somaNotas / qtdNotas : null,
    };
  }, [aulas, alunoDocId, user]);

  const desempenho = meuDesempenho();
  const percentPresenca = desempenho.totalAulas > 0
    ? Math.round((desempenho.presencas / desempenho.totalAulas) * 100)
    : 0;

  const getAulaRegistroAluno = (aula: Aula) => {
    if (!alunoDocId) return null;
    return aula.chamada?.find((c) => c.alunoId === alunoDocId) || null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{turma.nome}</Text>
        <View style={{ width: 40 }} />
      </View>

      <LinearGradient
        colors={['#0F0F19', '#1A1A2E']}
        style={styles.gradientContainer}
      >
        <ScrollView
          contentContainerStyle={styles.detalhesScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Card de Informações da Turma ─────────────────────────── */}
          <View style={[styles.infoCard, { borderColor: cor.border }]}>
            <View style={[styles.infoCardAccent, { backgroundColor: cor.accent }]} />
            <View style={styles.infoCardBody}>
              <View style={styles.infoCardHeader}>
                <View style={[styles.infoCardIcon, { backgroundColor: cor.bg }]}>
                  <FontAwesome5 name="chalkboard-teacher" size={22} color={cor.accent} />
                </View>
                <View style={styles.infoCardHeaderText}>
                  <Text style={styles.infoCardTitle}>{turma.nome}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: turma.status === 'ativa' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.15)' }
                  ]}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: turma.status === 'ativa' ? '#34D399' : '#94A3B8' }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: turma.status === 'ativa' ? '#34D399' : '#94A3B8' }
                    ]}>
                      {turma.status === 'ativa' ? 'Turma Ativa' : 'Turma Encerrada'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.infoCardRows}>
                <View style={styles.infoRow}>
                  <Feather name="user" size={15} color="#94A3B8" />
                  <Text style={styles.infoRowLabel}>Professor</Text>
                  <Text style={styles.infoRowValue}>{turma.professor}</Text>
                </View>
                <View style={styles.infoRowDivider} />
                <View style={styles.infoRow}>
                  <Feather name="clock" size={15} color="#94A3B8" />
                  <Text style={styles.infoRowLabel}>Horário</Text>
                  <Text style={styles.infoRowValue}>{turma.diaHorario}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Cards de Desempenho ──────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Meu Desempenho</Text>
          
          <View style={styles.statsGrid}>
            {/* Presença */}
            <View style={[styles.statCard, { borderColor: 'rgba(52, 211, 153, 0.2)' }]}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
                <Ionicons name="checkmark-circle" size={22} color="#34D399" />
              </View>
              <Text style={styles.statNumber}>{desempenho.presencas}</Text>
              <Text style={styles.statLabel}>Presenças</Text>
            </View>
            
            {/* Faltas */}
            <View style={[styles.statCard, { borderColor: 'rgba(251, 113, 133, 0.2)' }]}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(251, 113, 133, 0.12)' }]}>
                <Ionicons name="close-circle" size={22} color="#FB7185" />
              </View>
              <Text style={styles.statNumber}>{desempenho.faltas}</Text>
              <Text style={styles.statLabel}>Faltas</Text>
            </View>
            
            {/* % Frequência */}
            <View style={[styles.statCard, { borderColor: 'rgba(96, 165, 250, 0.2)' }]}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(96, 165, 250, 0.12)' }]}>
                <Ionicons name="stats-chart" size={22} color="#60A5FA" />
              </View>
              <Text style={styles.statNumber}>{percentPresenca}%</Text>
              <Text style={styles.statLabel}>Frequência</Text>
            </View>
            
            {/* Média */}
            <View style={[styles.statCard, { borderColor: 'rgba(251, 191, 36, 0.2)' }]}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(251, 191, 36, 0.12)' }]}>
                <FontAwesome5 name="star" size={18} color="#FBBF24" />
              </View>
              <Text style={styles.statNumber}>
                {desempenho.mediaNota !== null ? desempenho.mediaNota.toFixed(1) : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Média</Text>
            </View>
          </View>

          {/* ── Barra de Progresso de Frequência ────────────────────── */}
          {desempenho.totalAulas > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Frequência Geral</Text>
                <Text style={[styles.progressValue, {
                  color: percentPresenca >= 75 ? '#34D399' : percentPresenca >= 50 ? '#FBBF24' : '#FB7185'
                }]}>
                  {percentPresenca}%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${percentPresenca}%`,
                      backgroundColor: percentPresenca >= 75 ? '#34D399' : percentPresenca >= 50 ? '#FBBF24' : '#FB7185',
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* ── Diário de Classe (Aulas) ────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Diário de Classe</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{aulas.length} aula{aulas.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {carregandoAulas ? (
            <View style={styles.loadingAulas}>
              <ActivityIndicator size="small" color="#60A5FA" />
              <Text style={styles.loadingText}>Carregando aulas...</Text>
            </View>
          ) : aulas.length === 0 ? (
            <View style={styles.emptyAulas}>
              <View style={styles.emptyAulasIcon}>
                <FontAwesome5 name="book" size={28} color="#475569" />
              </View>
              <Text style={styles.emptyAulasTitle}>Nenhuma aula registrada</Text>
              <Text style={styles.emptyAulasDesc}>
                O professor ainda não registrou aulas nesta turma.
              </Text>
            </View>
          ) : (
            aulas.map((aula, idx) => {
              const registro = getAulaRegistroAluno(aula);
              const isExpanded = aulaExpandida === aula.id;

              return (
                <TouchableOpacity
                  key={aula.id}
                  activeOpacity={0.85}
                  onPress={() => setAulaExpandida(isExpanded ? null : aula.id)}
                  style={[styles.aulaCard, idx === aulas.length - 1 && { marginBottom: 30 }]}
                >
                  {/* Cabeçalho da Aula */}
                  <View style={styles.aulaHeader}>
                    <View style={styles.aulaDateBadge}>
                      <Feather name="calendar" size={14} color="#60A5FA" />
                      <Text style={styles.aulaDateText}>{formatarData(aula.data)}</Text>
                    </View>
                    
                    {registro ? (
                      <View style={[
                        styles.presencaBadge,
                        { backgroundColor: registro.presente ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 113, 133, 0.15)' }
                      ]}>
                        <View style={[
                          styles.presencaDot,
                          { backgroundColor: registro.presente ? '#34D399' : '#FB7185' }
                        ]} />
                        <Text style={[
                          styles.presencaText,
                          { color: registro.presente ? '#34D399' : '#FB7185' }
                        ]}>
                          {registro.presente ? 'Presente' : 'Falta'}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.presencaBadge, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.presencaText, { color: '#94A3B8' }]}>Sem registro</Text>
                      </View>
                    )}

                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="rgba(255,255,255,0.4)"
                    />
                  </View>

                  {/* Tema */}
                  <View style={styles.aulaBody}>
                    <FontAwesome5 name="book-open" size={14} color={cor.accent} style={{ marginTop: 2 }} />
                    <Text style={styles.aulaTema} numberOfLines={isExpanded ? undefined : 2}>{aula.tema}</Text>
                  </View>

                  {/* Detalhes expandidos */}
                  {isExpanded && registro && (
                    <View style={styles.aulaDetalhes}>
                      <View style={styles.aulaDetalhesRow}>
                        <View style={styles.aulaDetalheItem}>
                          <Text style={styles.aulaDetalheLabel}>Presença</Text>
                          <View style={styles.aulaDetalheValueRow}>
                            <Ionicons
                              name={registro.presente ? 'checkmark-circle' : 'close-circle'}
                              size={18}
                              color={registro.presente ? '#34D399' : '#FB7185'}
                            />
                            <Text style={[
                              styles.aulaDetalheValue,
                              { color: registro.presente ? '#34D399' : '#FB7185' }
                            ]}>
                              {registro.presente ? 'Presente' : 'Ausente'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.aulaDetalheItem}>
                          <Text style={styles.aulaDetalheLabel}>Nota</Text>
                          <View style={styles.aulaDetalheValueRow}>
                            <FontAwesome5 name="star" size={14} color="#FBBF24" />
                            <Text style={styles.aulaDetalheValue}>
                              {registro.nota !== null && registro.nota !== undefined
                                ? registro.nota.toFixed(1)
                                : 'Não atribuída'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F19',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0F0F19',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  gradientContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },

  // ── Cards de Turma ──────────────────────────────────────────────────────
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardAccentBar: {
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#CBD5E1',
  },

  // ── Empty State ─────────────────────────────────────────────────────────
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyStateIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  emptyStateDesc: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },

  // ═══ Tela de Detalhes da Turma ═══════════════════════════════════════════
  detalhesScroll: {
    padding: 20,
    paddingBottom: 40,
  },

  // ── Info Card ───────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  infoCardAccent: {
    height: 4,
  },
  infoCardBody: {
    padding: 20,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  infoCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoCardHeaderText: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  infoCardRows: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#94A3B8',
    flex: 1,
  },
  infoRowValue: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // ── Seção ───────────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  sectionBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  sectionBadgeText: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '700',
  },

  // ── Stats Grid ──────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    width: (SCREEN_WIDTH - 70) / 2,
    alignItems: 'center',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // ── Barra de Progresso ──────────────────────────────────────────────────
  progressContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },

  // ── Aulas ───────────────────────────────────────────────────────────────
  loadingAulas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  emptyAulas: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyAulasIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyAulasTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  emptyAulasDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // ── Card de Aula ────────────────────────────────────────────────────────
  aulaCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    marginBottom: 10,
  },
  aulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  aulaDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  aulaDateText: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '700',
  },
  presencaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  presencaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presencaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  aulaBody: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  aulaTema: {
    fontSize: 15,
    color: '#E2E8F0',
    flex: 1,
    lineHeight: 22,
  },

  // ── Detalhes expandidos ─────────────────────────────────────────────────
  aulaDetalhes: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  aulaDetalhesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  aulaDetalheItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
  },
  aulaDetalheLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  aulaDetalheValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aulaDetalheValue: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '600',
  },
});
