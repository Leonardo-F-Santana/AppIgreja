import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { ChevronLeft, BookOpen, Sparkles, Heart, Award } from 'lucide-react-native';

// ─── DADOS ESTÁTICOS (MOCK DATA) ───────────────────────────────────────────────
const AULA_SEMANA = {
  id: 'aula-semana-atual',
  tag: 'Aula da Semana',
  titulo: 'A Coragem de Davi',
  referencia: '1 Samuel 17',
  versiculoChave: '“O Senhor é a minha luz e a minha salvação; de quem terei medo?” — Salmos 27:1',
  resumo:
    'Nesta lição, as crianças aprenderam sobre a coragem do jovem Davi ao enfrentar o gigante Golias. Ensinamos que o tamanho dos nossos problemas não importa diante da grandeza de Deus. Quando confiamos no Senhor e colocamos nossa fé em ação, Ele nos capacita para vencer qualquer desafio com amor e mansidão.',
  momentoFamilia:
    'Dica para conversar à mesa: Pergunte aos seus filhos se eles já sentiram medo de algo no colégio ou na vida. Relembre que Davi orou e confiou. Orem juntos declarando coragem e paz sobre a casa.',
  atividades:
    '1. Desenhe 5 pedrinhas com palavras de fé (Fé, Oração, Amor, Paz, Coragem).\n2. Encenem juntos a história de Davi e Golias com brinquedos ou fantoches.',
};

const AULAS_ANTERIORES = [
  {
    id: 'aula-ant-1',
    titulo: 'A Arca de Noé',
    referencia: 'Gênesis 6 — 9',
    tag: 'Obediência',
    data: '05 Out',
  },
  {
    id: 'aula-ant-2',
    titulo: 'A Criação',
    referencia: 'Gênesis 1 — 2',
    tag: 'O Amor de Deus',
    data: '28 Set',
  },
  {
    id: 'aula-ant-3',
    titulo: 'Daniel e os Leões',
    referencia: 'Daniel 6',
    tag: 'Fidelidade',
    data: '21 Set',
  },
];

type TabTipo = 'resumo' | 'familia' | 'atividades';

export default function AulasKidsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  // Estado para alternância visual das abas/pílulas
  const [activeTab, setActiveTab] = useState<TabTipo>('resumo');

  const handleVoltar = () => {
    if (navigation && typeof (navigation as any).canGoBack === 'function' && (navigation as any).canGoBack()) {
      navigation.goBack();
    } else {
      try {
        router.back();
      } catch {
        // Fallback silencioso
      }
    }
  };

  return (
    <ImageBackground
      className="flex-1"
      resizeMode="cover"
      source={require('../../assets/Img/bdavisos.jpg')}
      style={[styles.backgroundImage, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* ─── 1. Cabeçalho com Botão de Voltar e Título ─────────────────────── */}
      <View className="flex-row items-center justify-between px-4 py-3" style={styles.header}>
        <TouchableOpacity
          onPress={handleVoltar}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-slate-200/60"
          style={styles.backButton}
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={22} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>

        <Text className="text-xl font-bold text-slate-900" style={styles.headerTitle}>
          Aulas e Ensino
        </Text>

        {/* Espaçador para centralizar o título */}
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        className="flex-1"
      >
        {/* ─── 2. Destaque: Aula da Semana ─────────────────────────────────── */}
        <View
          className="bg-white rounded-3xl p-5 shadow-sm mt-4 mx-4"
          style={styles.cardDestaque}
        >
          {/* Tag Amarela */}
          <View className="self-start bg-yellow-100 px-3 py-1 rounded-full mb-3" style={styles.tagAmarelaContainer}>
            <Text className="text-yellow-800 font-bold text-xs" style={styles.tagAmarelaText}>
              Aula da Semana
            </Text>
          </View>

          {/* Título da Lição */}
          <Text className="text-2xl font-extrabold text-slate-800 mb-1" style={styles.tituloLicao}>
            {AULA_SEMANA.titulo}
          </Text>

          {/* Referência Bíblica Sutil */}
          <View className="flex-row items-center mb-4" style={styles.referenciaRow}>
            <BookOpen size={14} color="#64748B" />
            <Text className="text-xs font-semibold text-slate-500 ml-1.5" style={styles.referenciaText}>
              {AULA_SEMANA.referencia}
            </Text>
          </View>

          {/* Abas / Pílulas visuais em ScrollView horizontal */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mb-4"
            contentContainerStyle={styles.pillsScrollContainer}
          >
            {/* Pílula: Resumo */}
            <TouchableOpacity
              onPress={() => setActiveTab('resumo')}
              activeOpacity={0.8}
              className={`px-4 py-2 rounded-full mr-2.5 ${
                activeTab === 'resumo' ? 'bg-blue-600' : 'bg-slate-100'
              }`}
              style={[
                styles.pillButton,
                activeTab === 'resumo' ? styles.pillActive : styles.pillInactive,
              ]}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'resumo' ? 'text-white' : 'text-slate-600'
                }`}
                style={activeTab === 'resumo' ? styles.pillTextActive : styles.pillTextInactive}
              >
                Resumo
              </Text>
            </TouchableOpacity>

            {/* Pílula: Momento Família */}
            <TouchableOpacity
              onPress={() => setActiveTab('familia')}
              activeOpacity={0.8}
              className={`px-4 py-2 rounded-full mr-2.5 ${
                activeTab === 'familia' ? 'bg-blue-600' : 'bg-slate-100'
              }`}
              style={[
                styles.pillButton,
                activeTab === 'familia' ? styles.pillActive : styles.pillInactive,
              ]}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'familia' ? 'text-white' : 'text-slate-600'
                }`}
                style={activeTab === 'familia' ? styles.pillTextActive : styles.pillTextInactive}
              >
                Momento Família
              </Text>
            </TouchableOpacity>

            {/* Pílula: Atividades */}
            <TouchableOpacity
              onPress={() => setActiveTab('atividades')}
              activeOpacity={0.8}
              className={`px-4 py-2 rounded-full ${
                activeTab === 'atividades' ? 'bg-blue-600' : 'bg-slate-100'
              }`}
              style={[
                styles.pillButton,
                activeTab === 'atividades' ? styles.pillActive : styles.pillInactive,
              ]}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'atividades' ? 'text-white' : 'text-slate-600'
                }`}
                style={activeTab === 'atividades' ? styles.pillTextActive : styles.pillTextInactive}
              >
                Atividades
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Bloco de Texto simulando o conteúdo selecionado */}
          <View className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100" style={styles.conteudoBloco}>
            {activeTab === 'resumo' && (
              <View>
                <Text className="text-slate-700 text-sm leading-6" style={styles.resumoTexto}>
                  {AULA_SEMANA.resumo}
                </Text>
                <View className="mt-3 pt-3 border-t border-slate-200/70" style={styles.versiculoBox}>
                  <Text className="text-xs font-semibold text-slate-500 italic" style={styles.versiculoTexto}>
                    {AULA_SEMANA.versiculoChave}
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'familia' && (
              <View>
                <View className="flex-row items-center mb-1.5" style={styles.tabIconHeader}>
                  <Heart size={15} color="#E11D48" />
                  <Text className="text-xs font-bold text-slate-800 ml-1.5" style={styles.tabHeaderTitle}>
                    Conversa em Casa
                  </Text>
                </View>
                <Text className="text-slate-700 text-sm leading-6" style={styles.resumoTexto}>
                  {AULA_SEMANA.momentoFamilia}
                </Text>
              </View>
            )}

            {activeTab === 'atividades' && (
              <View>
                <View className="flex-row items-center mb-1.5" style={styles.tabIconHeader}>
                  <Sparkles size={15} color="#D97706" />
                  <Text className="text-xs font-bold text-slate-800 ml-1.5" style={styles.tabHeaderTitle}>
                    Dinâmica Prática
                  </Text>
                </View>
                <Text className="text-slate-700 text-sm leading-6" style={styles.resumoTexto}>
                  {AULA_SEMANA.atividades}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── 3. Histórico de Aulas (Aulas Anteriores) ──────────────────────── */}
        <Text className="text-lg font-bold ml-6 mt-6 mb-2 text-slate-900" style={styles.secaoTitulo}>
          Aulas Anteriores
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.aulasAnterioresScroll}
          className="pb-8"
        >
          {AULAS_ANTERIORES.map((aula) => (
            <TouchableOpacity
              key={aula.id}
              activeOpacity={0.8}
              className="w-40 h-40 bg-white rounded-2xl p-4 mr-4 shadow-sm justify-between border border-slate-100"
              style={styles.cardAnterior}
            >
              <View>
                <View className="self-start bg-slate-100 px-2 py-0.5 rounded-full mb-2" style={styles.badgeAnterior}>
                  <Text className="text-[10px] font-semibold text-slate-600" style={styles.badgeAnteriorTexto}>
                    {aula.tag}
                  </Text>
                </View>
                <Text
                  className="font-bold text-slate-800 text-base leading-5 mt-1"
                  style={styles.cardAnteriorTitulo}
                  numberOfLines={2}
                >
                  {aula.titulo}
                </Text>
              </View>

              <View className="flex-row items-center justify-between pt-2 border-t border-slate-100" style={styles.cardAnteriorFooter}>
                <View className="flex-row items-center flex-1 mr-1" style={styles.cardAnteriorRefRow}>
                  <BookOpen size={11} color="#94A3B8" />
                  <Text
                    className="text-[11px] font-medium text-slate-500 ml-1"
                    style={styles.cardAnteriorRef}
                    numberOfLines={1}
                  >
                    {aula.referencia}
                  </Text>
                </View>
                <Award size={14} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </ImageBackground>
  );
}

// ─── ESTILOS COMPLEMENTARES PARA COMPATIBILIDADE E POLIMENTO ─────────────────
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A', // slate-900
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardDestaque: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // rounded-3xl
    padding: 20, // p-5
    marginTop: 16, // mt-4
    marginHorizontal: 16, // mx-4
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tagAmarelaContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF9C3', // yellow-100
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  tagAmarelaText: {
    color: '#854D0E', // yellow-800
    fontWeight: '700',
    fontSize: 12,
  },
  tituloLicao: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B', // slate-800
  },
  referenciaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenciaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B', // slate-500
  },
  pillsScrollContainer: {
    paddingRight: 10,
    alignItems: 'center',
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  pillActive: {
    backgroundColor: '#2563EB', // blue-600
  },
  pillInactive: {
    backgroundColor: '#F1F5F9', // slate-100
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextInactive: {
    color: '#475569', // slate-600
    fontSize: 12,
    fontWeight: '700',
  },
  conteudoBloco: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  resumoTexto: {
    color: '#334155', // slate-700
    fontSize: 14,
    lineHeight: 22,
  },
  versiculoBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  versiculoTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontStyle: 'italic',
  },
  tabIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tabHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 24,
    marginTop: 24,
    marginBottom: 8,
    color: '#0F172A',
  },
  aulasAnterioresScroll: {
    paddingLeft: 24,
    paddingRight: 8,
  },
  cardAnterior: {
    width: 160, // w-40
    height: 160, // h-40
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    padding: 16, // p-4
    marginRight: 16, // mr-4
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  badgeAnterior: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgeAnteriorTexto: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  cardAnteriorTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 20,
  },
  cardAnteriorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardAnteriorRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAnteriorRef: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
});
