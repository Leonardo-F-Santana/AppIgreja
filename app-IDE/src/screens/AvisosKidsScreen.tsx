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
  Image,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// ─── Imagens Locais ───────────────────────────────────────────────────────────
const bgAvisos = require('../../assets/Img/bdavisos.jpg');
const jesusOvelhinha = require('../../assets/Img/jesuseaovelhinha.png');
const avisosKidsImg = require('../../assets/Img/avisos_kids.png');

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
  const insets = useSafeAreaInsets();

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
    <ImageBackground
      source={bgAvisos}
      resizeMode="cover"
      className="flex-1"
      style={styles.backgroundImage}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* ─── 1. Cabeçalho Seguro no Topo ────────────────────────────────────────── */}
      <View
        style={[styles.headerRow, { paddingTop: Math.max(insets.top + 6, 16) }]}
      >
        <TouchableOpacity
          onPress={handleVoltar}
          activeOpacity={0.7}
          style={[styles.backButton, { top: Math.max(insets.top + 6, 16) + 20 }]}
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={22} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>

        <Image
          source={avisosKidsImg}
          style={styles.headerImage}
          resizeMode="contain"
          accessibilityLabel="Avisos do Ministério Kids"
        />
      </View>

      {/* ─── 2. Barra de Pesquisa (SearchBar Pílula) ─────────────────────────── */}
      <View style={styles.searchContainer} className="px-5 pb-3">
        <View
          className="flex-row items-center bg-white rounded-full px-4 py-2.5 shadow-sm border border-white/80"
          style={styles.searchBar}
        >
          <Search size={18} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por título ou conteúdo..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-2 text-slate-800 text-sm font-medium"
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
              <X size={15} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── 3. Lista de Avisos (FlatList com Cards Pastéis Alternados) ────────── */}
      {loading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#EAB308" />
          <Text className="text-slate-500 font-medium text-sm mt-3">Carregando avisos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAvisos}
          keyExtractor={(item, index) => item.id || `aviso-${index}`}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 220, // Garante que a rolagem passe por trás da imagem de Jesus
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-16 bg-white/90 rounded-[26px] p-6 border border-white shadow-sm mt-4">
              <View className="w-16 h-16 rounded-full bg-yellow-100 items-center justify-center mb-3">
                <Megaphone size={28} color="#CA8A04" />
              </View>
              <Text className="text-base font-bold text-slate-800 text-center mb-1">
                {searchQuery.trim()
                  ? 'Nenhum aviso encontrado'
                  : 'Nenhum aviso no momento'}
              </Text>
              <Text className="text-xs text-slate-500 text-center leading-5 max-w-[260px]">
                {searchQuery.trim()
                  ? `Não encontramos resultados para "${searchQuery}".`
                  : 'Fique atento! Novidades e comunicados importantes do Ministério Kids serão exibidos aqui.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              className="bg-white/95 rounded-[24px] p-5 mb-4 shadow-sm border border-slate-100"
              style={styles.card}
            >
              {/* Tag Superior */}
              <View
                className="bg-yellow-100 rounded-full px-3 py-1 mb-3 self-start"
                style={styles.tagContainer}
              >
                <Text
                  className="text-yellow-700 font-bold text-xs"
                  style={styles.tagText}
                >
                  Ministério Kids
                </Text>
              </View>

              {/* Título */}
              <Text
                className="text-lg font-bold text-slate-800 mb-2"
                style={styles.cardTitle}
              >
                {item.titulo}
              </Text>

              {/* Mensagem */}
              <Text
                className="text-slate-600 leading-6"
                style={styles.cardMensagem}
              >
                {item.mensagem}
              </Text>

              {/* Rodapé do Balão (Data) */}
              {Boolean(item.dataCriacao) && (
                <View
                  className="flex-row items-center mt-4 pt-4 border-t border-slate-100/50"
                  style={styles.cardFooter}
                >
                  <Calendar size={13} color="#94A3B8" />
                  <Text
                    className="text-slate-400 text-xs ml-1 font-medium"
                    style={styles.cardData}
                  >
                    {formatarData(item.dataCriacao)}
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* ─── 4. Imagem Fixa de Jesus no Canto Inferior Direito ──────────────────── */}
      <Image
        source={jesusOvelhinha}
        className="absolute bottom-[-10px] right-[-10px] w-48 h-56 z-50"
        style={styles.jesusImage}
        resizeMode="contain"
        accessibilityLabel="Jesus e a ovelhinha"
      />
    </ImageBackground>
  );
}

// ─── Estilos Complementares (Garantia de Renderização sem Depender do CSS Engine) ─
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerImage: {
    width: 220,
    height: 80,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#1E293B',
    fontSize: 14,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tagText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardMensagem: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardData: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
  },
  jesusImage: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 192,
    height: 224,
    zIndex: 50,
  },
});
