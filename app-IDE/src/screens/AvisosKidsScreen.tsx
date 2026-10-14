import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { Search, ChevronLeft, Calendar, Megaphone, X } from 'lucide-react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AvisoKids {
  id?: string;
  titulo: string;
  mensagem: string;
  dataCriacao: Timestamp | Date | null | any;
}

// ─── Helper de Formatação de Data ─────────────────────────────────────────────

function formatarData(dataCriacao: any): string {
  if (!dataCriacao) return '';
  try {
    const d = dataCriacao?.toDate
      ? dataCriacao.toDate()
      : dataCriacao instanceof Date
      ? dataCriacao
      : new Date(dataCriacao);

    if (isNaN(d.getTime())) return '';

    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} às ${hora}:${min}`;
  } catch {
    return '';
  }
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function AvisosKidsScreen({ navigation: navProp }: any = {}) {
  const router = useRouter();
  const navHook = useNavigation<any>();
  const navigation = navProp || navHook;

  // 1. Estados da Tela (Preservados integralmente)
  const [avisos, setAvisos] = useState<AvisoKids[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAvisos, setFilteredAvisos] = useState<AvisoKids[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Leitura de Dados em Tempo Real (Firebase Firestore ordenado pelo mais recente)
  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, 'avisos_kids'),
      orderBy('dataCriacao', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista: AvisoKids[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            titulo: data.titulo || '',
            mensagem: data.mensagem || '',
            dataCriacao: data.dataCriacao || null,
          };
        });

        setAvisos(lista);
        setLoading(false);
      },
      (error) => {
        console.error('[AvisosKidsScreen] Erro ao carregar avisos:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Lógica de Busca / Filtro Local (pelo título ou mensagem)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAvisos(avisos);
      return;
    }

    const termo = searchQuery.toLowerCase().trim();
    const filtrados = avisos.filter((aviso) => {
      const tituloMatch = (aviso.titulo || '').toLowerCase().includes(termo);
      const mensagemMatch = (aviso.mensagem || '').toLowerCase().includes(termo);
      return tituloMatch || mensagemMatch;
    });

    setFilteredAvisos(filtrados);
  }, [searchQuery, avisos]);

  // Função para voltar
  const handleVoltar = () => {
    if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ─── 1. Cabeçalho Personalizado ────────────────────────────────────────── */}
      <View className="flex-row items-center px-6 pt-4 pb-2">
        <TouchableOpacity
          onPress={handleVoltar}
          activeOpacity={0.7}
          className="bg-white p-2 rounded-full shadow-sm border border-slate-100"
          style={styles.backButton}
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>

        <Text className="text-2xl font-extrabold text-slate-800 ml-4">
          Avisos e Novidades
        </Text>
      </View>

      {/* ─── 2. Barra de Pesquisa (Search Bar) ─────────────────────────────────── */}
      <View className="px-6 py-4">
        <View
          className="flex-row items-center bg-white rounded-full px-4 py-3 shadow-sm border border-slate-100"
          style={styles.searchBar}
        >
          <Search size={20} color="#EAB308" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar avisos..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-2 text-slate-800 text-base"
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="p-1 rounded-full bg-slate-100 ml-1"
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── 3. Lista e Cartões de Aviso (FlatList) ───────────────────────────── */}
      {loading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#EAB308" />
          <Text className="text-slate-400 text-sm mt-3">Carregando avisos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAvisos}
          keyExtractor={(item, index) => item.id || `aviso-${index}`}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-16 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm mt-2">
              <View className="w-16 h-16 rounded-full bg-yellow-100 items-center justify-center mb-3">
                <Megaphone size={28} color="#CA8A04" />
              </View>
              <Text className="text-base font-bold text-slate-800 text-center mb-1">
                {searchQuery.trim()
                  ? 'Nenhum aviso encontrado'
                  : 'Nenhum aviso no momento'}
              </Text>
              <Text className="text-xs text-slate-400 text-center leading-5 max-w-[260px]">
                {searchQuery.trim()
                  ? `Não encontramos resultados para "${searchQuery}".`
                  : 'Fique atento! Novidades e comunicados importantes do Ministério Kids serão exibidos aqui.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              className="bg-white rounded-[24px] p-5 mb-5 shadow-sm border border-slate-50"
              style={styles.card}
            >
              {/* Tag "Ministério Kids" */}
              <View className="bg-yellow-100 self-start px-3 py-1 rounded-full mb-3">
                <Text className="text-yellow-700 font-bold text-xs">
                  Ministério Kids
                </Text>
              </View>

              {/* Título */}
              <Text className="text-lg font-bold text-slate-800 mb-2">
                {item.titulo}
              </Text>

              {/* Mensagem */}
              <Text className="text-slate-600 leading-6">
                {item.mensagem}
              </Text>

              {/* Rodapé (Data) */}
              {Boolean(item.dataCriacao) && (
                <View className="flex-row items-center mt-4">
                  <Calendar size={13} color="#94A3B8" />
                  <Text className="text-slate-400 text-xs ml-1">
                    {formatarData(item.dataCriacao)}
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Estilos Complementares (Sombras e plataforma) ────────────────────────────

const styles = StyleSheet.create({
  backButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
});
