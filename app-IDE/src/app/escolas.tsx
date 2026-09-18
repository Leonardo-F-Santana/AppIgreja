import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collectionGroup, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

interface Turma {
  id: string;
  nome: string;
  diasAulas: string[];
  horario: string;
}

export default function EscolasScreen() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        
        // Usamos um Set para evitar turmas duplicadas caso haja redundância
        const turmasIds = new Set<string>();

        for (const alunoDoc of alunosSnapshot.docs) {
          // O caminho é turmas/{turmaId}/alunos/{alunoId}
          // ref.parent é a collection "alunos"
          // ref.parent.parent é o documento da turma
          const turmaRef = alunoDoc.ref.parent.parent;
          
          if (turmaRef && !turmasIds.has(turmaRef.id)) {
            turmasIds.add(turmaRef.id);
            const turmaDoc = await getDoc(turmaRef);
            
            if (turmaDoc.exists()) {
              const data = turmaDoc.data();
              turmasEncontradas.push({
                id: turmaDoc.id,
                nome: data.nome || 'Turma sem nome',
                diasAulas: Array.isArray(data.diasAulas) ? data.diasAulas : [],
                horario: data.horario || '--:--',
              });
            }
          }
        }

        setTurmas(turmasEncontradas);
      } catch (error) {
        console.error('Erro ao buscar turmas do aluno:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMinhasTurmas();
  }, []);

  const renderTurmaCard = ({ item }: { item: Turma }) => {
    const diasStr = item.diasAulas.length > 0 ? item.diasAulas.join(', ') : 'Dias não definidos';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <FontAwesome5 name="book-reader" size={20} color="#60A5FA" />
          </View>
          <Text style={styles.cardTitle}>{item.nome}</Text>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={16} color="#94A3B8" />
            <Text style={styles.detailText}>{diasStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="clock" size={16} color="#94A3B8" />
            <Text style={styles.detailText}>{item.horario}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconCircle}>
        <FontAwesome5 name="graduation-cap" size={48} color="#475569" />
      </View>
      <Text style={styles.emptyStateTitle}>Nenhuma Matrícula</Text>
      <Text style={styles.emptyStateDesc}>
        Você ainda não está inscrito em nenhuma escola ou turma.
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
    fontSize: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
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
    fontSize: 15,
    color: '#E2E8F0',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});
