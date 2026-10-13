import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Heart,
  Baby,
  Plus,
  X,
  ChevronLeft,
  Calendar,
  Phone,
  User,
  ShieldAlert,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Star,
  Sun,
  Smile,
  Info,
  Users,
  Megaphone,
  BookOpen,
} from 'lucide-react-native';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { ouvirAvisosKids, type AvisoKids } from '../services/kidsService';

const topoKids = require('../../assets/Img/topo_kids.png');

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface FichaInclusao {
  condicao: string;
  alergias: string;
  gatilhos: string;
  comoAcalmar: string;
}

export interface Crianca {
  id: string;
  nome: string;
  dataNascimento: string;
  nomeResponsavel: string;
  telefoneEmergencia: string;
  membroIdResponsavel?: string;
  fichaInclusao?: FichaInclusao | null;
  criadoEm?: Timestamp | null;
}

// ─── Auxiliares de Formatação e Idade ──────────────────────────────────────────

function calcularIdade(dataNasc: string): string {
  if (!dataNasc) return '';
  try {
    const partes = dataNasc.split('/');
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const ano = parseInt(partes[2], 10);
      const nasc = new Date(ano, mes, dia);
      const hoje = new Date();
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
      }
      if (idade < 0) return '';
      if (idade === 0) return 'Menos de 1 ano';
      if (idade === 1) return '1 aninho';
      return `${idade} anos`;
    }
  } catch {
    // Retorna vazio caso dê erro de parse
  }
  return '';
}

function formatarDataInput(texto: string): string {
  const limpo = texto.replace(/\D/g, '');
  if (limpo.length <= 2) return limpo;
  if (limpo.length <= 4) return `${limpo.slice(0, 2)}/${limpo.slice(2)}`;
  return `${limpo.slice(0, 2)}/${limpo.slice(2, 4)}/${limpo.slice(4, 8)}`;
}

function formatarTelefoneInput(texto: string): string {
  const limpo = texto.replace(/\D/g, '');
  if (limpo.length <= 2) return limpo.length > 0 ? `(${limpo}` : '';
  if (limpo.length <= 7) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
  if (limpo.length <= 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`;
  }
  return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function MinisterioKidsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Estados de dados
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  // Mural de Avisos Kids
  const [avisos, setAvisos] = useState<AvisoKids[]>([]);

  // Estados do Modal
  const [modalVisivel, setModalVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Formulário Base
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefoneEmergencia, setTelefoneEmergencia] = useState('');

  // Toggle Inclusão
  const [precisaAtencaoEspecial, setPrecisaAtencaoEspecial] = useState(false);

  // Formulário Inclusão
  const [condicao, setCondicao] = useState('');
  const [alergias, setAlergias] = useState('');
  const [gatilhos, setGatilhos] = useState('');
  const [comoAcalmar, setComoAcalmar] = useState('');

  // Animação da seção de inclusão
  const animInclusao = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animInclusao, {
      toValue: precisaAtencaoEspecial ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [precisaAtencaoEspecial]);

  // ─── Escutar Coleção kids do Firestore ─────────────────────────────────────
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCriancas([]);
        setLoading(false);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        return;
      }

      const q = query(
        collection(db, 'kids'),
        where('membroIdResponsavel', '==', user.uid)
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const lista: Crianca[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              nome: data.nome || '',
              dataNascimento: data.dataNascimento || '',
              nomeResponsavel: data.nomeResponsavel || '',
              telefoneEmergencia: data.telefoneEmergencia || '',
              membroIdResponsavel: data.membroIdResponsavel || '',
              fichaInclusao: data.fichaInclusao || null,
              criadoEm: data.criadoEm || null,
            };
          });

          // Ordenar alfabeticamente
          lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
          setCriancas(lista);
          setLoading(false);
        },
        (error) => {
          console.error('[MinisterioKidsScreen] Erro ao buscar crianças:', error);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // ─── Escutar Coleção avisos_kids (mais recentes primeiro) ──────────────
  useEffect(() => {
    const unsubscribe = ouvirAvisosKids((dados) => setAvisos(dados));
    return () => unsubscribe();
  }, []);

  // ─── Ações de Formulário ───────────────────────────────────────────────────

  const resetForm = () => {
    setNome('');
    setDataNascimento('');
    setTelefoneEmergencia('');
    setPrecisaAtencaoEspecial(false);
    setCondicao('');
    setAlergias('');
    setGatilhos('');
    setComoAcalmar('');
  };

  const abrirModal = () => {
    resetForm();
    setModalVisivel(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalVisivel(false);
    resetForm();
  };

  const salvarCrianca = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para cadastrar seu filho(a).');
      return;
    }

    if (!nome.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o nome da criança.');
      return;
    }
    if (!dataNascimento.trim() || dataNascimento.length < 10) {
      Alert.alert('Data de Nascimento', 'Informe a data de nascimento completa (DD/MM/AAAA).');
      return;
    }
    if (!telefoneEmergencia.trim() || telefoneEmergencia.length < 14) {
      Alert.alert('Telefone de Emergência', 'Informe um telefone de contato válido com DDD.');
      return;
    }

    setSalvando(true);
    try {
      const fichaInclusaoData = precisaAtencaoEspecial
        ? {
          condicao: condicao.trim(),
          alergias: alergias.trim(),
          gatilhos: gatilhos.trim(),
          comoAcalmar: comoAcalmar.trim(),
        }
        : null;

      await addDoc(collection(db, 'kids'), {
        nome: nome.trim(),
        dataNascimento: dataNascimento.trim(),
        nomeResponsavel: user.displayName || user.email || 'Responsável',
        telefoneEmergencia: telefoneEmergencia.trim(),
        membroIdResponsavel: user.uid,
        fichaInclusao: fichaInclusaoData,
        criadoEm: serverTimestamp(),
      });

      fecharModal();
      Alert.alert(
        '🎉 Cadastro Concluído!',
        `${nome.trim()} foi cadastrado(a) com sucesso no Ministério Kids! Nossa equipe cuidará dele(a) com muito carinho e atenção especial.`
      );
    } catch (error: any) {
      console.error('[MinisterioKidsScreen] Erro ao cadastrar criança:', error);
      Alert.alert('Erro ao Salvar', 'Não foi possível cadastrar no momento. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = (crianca: Crianca) => {
    Alert.alert(
      'Remover Cadastro',
      `Deseja realmente remover o cadastro de ${crianca.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'kids', crianca.id));
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível remover o cadastro.');
            }
          },
        },
      ]
    );
  };

  const totalComInclusao = criancas.filter((c) => !!c.fichaInclusao).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* ─── Scroll Principal da Página (Desbloqueia rolagem suave de todo o conteúdo) ─ */}
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={[
          styles.pageScrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── 1. O Topo Visível (Sem Cortes) ───────────────────────────────── */}
        <View style={styles.topoContainer} className="relative w-full">
          {/* Botão de Voltar discreto com fundo circular translúcido no canto superior esquerdo */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButtonCircle, { top: Math.max(insets.top + 8, 16) }]}
            className="absolute left-4 z-20 w-10 h-10 rounded-full bg-black/30 items-center justify-center"
            activeOpacity={0.7}
            accessibilityLabel="Voltar"
          >
            <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>


          {/* Imagem de Topo inteira e centralizada */}
          <Image
            source={topoKids}
            resizeMode="contain"
            className="w-full h-[240px]"
            style={styles.topoKidsImage}
            accessibilityLabel="Ministério Kids"
          />
        </View>

        {/* ─── 2. Container de Conteúdo (Sem Margens Negativas) ─────────────── */}
        <View className="px-4 pb-6" style={styles.contentContainer}>
          {/* Card Azul de Resumo */}
          <View style={styles.blueCardWrapper} className="w-full mt-1 z-20">
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.blueCard}
              className="rounded-[24px] p-5 shadow-lg shadow-blue-500/25"
            >
              {/* Cabeçalho do Card */}
              <View style={styles.blueCardHeader} className="flex-row items-center mb-3.5">
                <View style={styles.blueCardIconCircle} className="w-11 h-11 rounded-full bg-white/20 items-center justify-center mr-3">
                  <Heart size={22} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blueCardTitle} className="text-white text-base font-bold">
                    Cuidado que acolhe cada criança
                  </Text>
                  <Text style={styles.blueCardDesc} className="text-blue-100 text-xs mt-0.5 leading-4">
                    Equipe capacitada para incluir crianças atípicas e garantir um momento seguro e alegre.
                  </Text>
                </View>
              </View>

              {/* Duas Colunas com linha vertical translúcida */}
              <View style={styles.blueCardMetricsRow} className="flex-row items-center bg-white/15 rounded-2xl py-2.5 px-3 border border-white/10">
                {/* Coluna 1: Filhos Cadastrados */}
                <View style={styles.blueCardMetricColLeft} className="flex-1 items-center border-r border-blue-400">
                  <Text style={styles.blueMetricNumber} className="text-white text-xl font-extrabold">
                    {criancas.length}
                  </Text>
                  <Text style={styles.blueMetricLabel} className="text-blue-100 text-xs font-medium mt-0.5">
                    {criancas.length === 1 ? 'Filho Cadastrado' : 'Filhos Cadastrados'}
                  </Text>
                </View>

                {/* Coluna 2: Atenção Especial */}
                <View style={styles.blueCardMetricColRight} className="flex-1 items-center">
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.blueMetricNumber, { color: '#FDE047' }]} className="text-amber-300 text-xl font-extrabold">
                      {totalComInclusao}
                    </Text>
                    <Text style={{ fontSize: 14, marginLeft: 4 }}>💛</Text>
                  </View>
                  <Text style={styles.blueMetricLabel} className="text-blue-100 text-xs font-medium mt-0.5">
                    Atenção Especial
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ─── 3. Avisos e Novidades ────────────────────────────────────────── */}
          <View style={styles.avisosContainer} className="mt-4 p-4 bg-yellow-50 rounded-[24px] border border-yellow-200">
            <View style={styles.avisosHeaderRow} className="flex-row items-center justify-between mb-3">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Megaphone size={19} color="#D97706" />
                <Text style={styles.avisosHeaderTitle} className="text-base font-extrabold text-slate-800 ml-2">
                  Avisos e Novidades
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/avisos')}
                style={styles.verTodosButton}
                className="bg-yellow-200 px-3 py-1.5 rounded-full"
                activeOpacity={0.7}
              >
                <Text style={styles.verTodosButtonText} className="text-xs font-bold text-amber-900">
                  Ver todos &gt;
                </Text>
              </TouchableOpacity>
            </View>

            {avisos.length === 0 ? (
              <View style={styles.avisoCardEmpty} className="bg-[#FFFDF7] rounded-2xl p-4 border border-amber-200/60 items-center justify-center py-5">
                <Text style={styles.avisoCardEmptyText} className="text-xs text-amber-800">
                  Nenhum aviso novo no momento. Fique ligado! ✨
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.avisosScrollContent}
              >
                {avisos.map((aviso, idx) => (
                  <View
                    key={aviso.id ?? idx}
                    style={styles.avisoCard}
                    className="w-[270px] mr-3 bg-[#FFFDF7] rounded-2xl p-4 border border-amber-200/70 shadow-sm"
                  >
                    {/* Tag Amarela */}
                    <View style={styles.avisoTag} className="self-start bg-amber-100 px-2.5 py-0.5 rounded-full mb-2 border border-amber-200">
                      <Text style={styles.avisoTagText} className="text-[11px] font-bold text-amber-800">
                        Ministério Kids
                      </Text>
                    </View>

                    {/* Título */}
                    <Text
                      style={styles.avisoTitulo}
                      className="text-sm font-bold text-slate-800 mb-1"
                      numberOfLines={2}
                    >
                      {aviso.titulo}
                    </Text>

                    {/* Mensagem */}
                    <Text
                      style={styles.avisoMensagem}
                      className="text-xs text-slate-600 leading-5"
                      numberOfLines={3}
                    >
                      {aviso.mensagem}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ─── 4. Menu de Ações Rápidas (3 Botões) ───────────────────────────── */}
          <View style={styles.quickActionsContainer} className="mt-4 flex-row justify-between w-full">
            {/* Botão 1: Cadastro dos Filhos */}
            <TouchableOpacity
              onPress={abrirModal}
              style={styles.quickActionCardPurple}
              className="flex-1 bg-purple-100 rounded-2xl p-3 items-center border border-purple-200 shadow-sm"
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconPurple} className="w-10 h-10 rounded-full bg-purple-200/80 items-center justify-center mb-2">
                <Smile size={22} color="#7C3AED" />
              </View>
              <Text style={styles.quickActionTitlePurple} className="text-xs font-bold text-purple-900 text-center" numberOfLines={2}>
                Cadastro dos Filhos
              </Text>
              <Text style={[styles.quickActionSubtitle, { color: '#9333EA' }]} className="text-[10px] text-purple-700 text-center mt-0.5">
                Cadastre aqui
              </Text>
            </TouchableOpacity>

            {/* Botão 2: Eventos */}
            <TouchableOpacity
              onPress={() => router.push('/eventos')}
              style={styles.quickActionCardGreen}
              className="flex-1 bg-green-100 rounded-2xl p-3 items-center border border-green-200 shadow-sm"
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconGreen} className="w-10 h-10 rounded-full bg-green-200/80 items-center justify-center mb-2">
                <Calendar size={22} color="#059669" />
              </View>
              <Text style={styles.quickActionTitleGreen} className="text-xs font-bold text-green-900 text-center" numberOfLines={1}>
                Eventos
              </Text>
              <Text style={[styles.quickActionSubtitle, { color: '#16A34A' }]} className="text-[10px] text-green-700 text-center mt-0.5">
                Cultos & Festas
              </Text>
            </TouchableOpacity>

            {/* Botão 3: Recursos */}
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Recursos Kids',
                  'Em breve: Livros, materiais didáticos, histórias bíblicas e cartilhas para apoiar a sua família! 📖'
                )
              }
              style={styles.quickActionCardBlue}
              className="flex-1 bg-blue-100 rounded-2xl p-3 items-center border border-blue-200 shadow-sm"
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconBlue} className="w-10 h-10 rounded-full bg-blue-200/80 items-center justify-center mb-2">
                <BookOpen size={22} color="#2563EB" />
              </View>
              <Text style={styles.quickActionTitleBlue} className="text-xs font-bold text-blue-900 text-center" numberOfLines={1}>
                Recursos
              </Text>
              <Text style={[styles.quickActionSubtitle, { color: '#2563EB' }]} className="text-[10px] text-blue-700 text-center mt-0.5">
                Apoio & Aulas
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── 5. Seção Meus Filhos ──────────────────────────────────────────── */}
          <View style={styles.meusFilhosHeader} className="flex-row justify-between items-center mt-6 mb-4">
            <View style={styles.meusFilhosTitleRow} className="flex-row items-center">
              <View style={styles.meusFilhosIconBubble} className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center mr-2.5">
                <Users size={19} color="#0F172A" />
              </View>
              <Text style={styles.meusFilhosTitle} className="text-xl font-extrabold text-slate-900">
                Meus Filhos
              </Text>
            </View>

            <TouchableOpacity
              onPress={abrirModal}
              style={styles.botaoAdicionarFilho}
              className="bg-pink-500 px-4 py-2.5 rounded-full shadow-md shadow-pink-500/30 flex-row items-center"
              activeOpacity={0.85}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={3} />
              <Text style={styles.botaoAdicionarFilhoText} className="text-white text-xs font-bold ml-1.5">
                + Adicionar Filho
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── Lista de Crianças ──────────────────────────────────────────────── */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Carregando crianças cadastradas...</Text>
            </View>
          ) : (
            <View style={styles.listContent}>
              {criancas.length === 0 ? (
                /* Empty State */
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <Baby size={42} color="#3B82F6" />
                  </View>
                  <Text style={styles.emptyTitle}>Nenhuma criança cadastrada ainda</Text>
                  <Text style={styles.emptyText}>
                    Cadastre seus pequenos para que nossos tios e tias voluntários tenham todas
                    as informações necessárias para cuidar com muito amor e segurança!
                  </Text>
                  <TouchableOpacity
                    onPress={abrirModal}
                    style={styles.emptyActionButton}
                    activeOpacity={0.85}
                  >
                    <Plus size={18} color="#FFFFFF" />
                    <Text style={styles.emptyActionButtonText}>Cadastrar Meu Filho(a) Agora</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                criancas.map((crianca, idx) => {
                  const idade = calcularIdade(crianca.dataNascimento);
                  const temInclusao = !!crianca.fichaInclusao;
                  const expandido = expandidoId === crianca.id;

                  // Cores dinâmicas para avatar
                  const coresAvatar = [
                    ['#FDE68A', '#F59E0B'],
                    ['#BAE6FD', '#0284C7'],
                    ['#FBCFE8', '#DB2777'],
                    ['#DDD6FE', '#7C3AED'],
                    ['#A7F3D0', '#059669'],
                  ];
                  const cor = coresAvatar[idx % coresAvatar.length];

                  return (
                    <View key={crianca.id} style={styles.kidCard}>
                      {/* Linha Principal do Card */}
                      <View style={styles.kidCardHeader}>
                        {/* Avatar Lúdico */}
                        <LinearGradient
                          colors={cor as [string, string]}
                          style={styles.avatarCircle}
                        >
                          <Text style={styles.avatarInitials}>
                            {crianca.nome.charAt(0).toUpperCase()}
                          </Text>
                        </LinearGradient>

                        {/* Dados Básicos */}
                        <View style={styles.kidInfoCol}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Text style={styles.kidName}>{crianca.nome}</Text>
                            {temInclusao && (
                              <View style={styles.specialBadge}>
                                <Text style={styles.specialBadgeText}>💛 Atenção Especial</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.kidMetaRow}>
                            {idade ? (
                              <View style={styles.kidMetaItem}>
                                <Smile size={13} color="#64748B" />
                                <Text style={styles.kidMetaText}>{idade}</Text>
                              </View>
                            ) : null}

                            <View style={styles.kidMetaItem}>
                              <Calendar size={13} color="#64748B" />
                              <Text style={styles.kidMetaText}>{crianca.dataNascimento}</Text>
                            </View>
                          </View>

                          <View style={styles.kidMetaRow}>
                            <View style={styles.kidMetaItem}>
                              <Phone size={13} color="#64748B" />
                              <Text style={styles.kidMetaText}>
                                Emergência: {crianca.telefoneEmergencia}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Botão de Excluir */}
                        <TouchableOpacity
                          onPress={() => confirmarExclusao(crianca)}
                          style={styles.deleteButton}
                          activeOpacity={0.7}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash2 size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>

                      {/* Detalhes de Inclusão (Expansível ou Exibido) */}
                      {temInclusao && crianca.fichaInclusao && (
                        <View style={styles.inclusaoBox}>
                          <TouchableOpacity
                            onPress={() =>
                              setExpandidoId(expandido ? null : crianca.id)
                            }
                            style={styles.inclusaoToggleHeader}
                            activeOpacity={0.7}
                          >
                            <View style={styles.inclusaoIconTitle}>
                              <Heart size={16} color="#D97706" fill="#FDE68A" />
                              <Text style={styles.inclusaoBoxTitle}>
                                Ficha de Inclusão Ativa
                              </Text>
                            </View>
                            <Text style={styles.inclusaoExpandText}>
                              {expandido ? 'Ocultar Detalhes ▲' : 'Ver Detalhes ▼'}
                            </Text>
                          </TouchableOpacity>

                          {expandido && (
                            <View style={styles.inclusaoContent}>
                              {crianca.fichaInclusao.condicao ? (
                                <View style={styles.inclusaoField}>
                                  <Text style={styles.inclusaoLabel}>Condição / Laudo:</Text>
                                  <Text style={styles.inclusaoValue}>
                                    {crianca.fichaInclusao.condicao}
                                  </Text>
                                </View>
                              ) : null}

                              {crianca.fichaInclusao.alergias ? (
                                <View style={styles.inclusaoField}>
                                  <Text style={styles.inclusaoLabel}>Alergias ou Restrições:</Text>
                                  <Text style={styles.inclusaoValue}>
                                    {crianca.fichaInclusao.alergias}
                                  </Text>
                                </View>
                              ) : null}

                              {crianca.fichaInclusao.gatilhos ? (
                                <View style={styles.inclusaoField}>
                                  <Text style={styles.inclusaoLabel}>Gatilhos de Desconforto:</Text>
                                  <Text style={styles.inclusaoValue}>
                                    {crianca.fichaInclusao.gatilhos}
                                  </Text>
                                </View>
                              ) : null}

                              {crianca.fichaInclusao.comoAcalmar ? (
                                <View style={styles.inclusaoField}>
                                  <Text style={styles.inclusaoLabel}>Como Ajudar a Acalmar:</Text>
                                  <Text style={styles.inclusaoValue}>
                                    {crianca.fichaInclusao.comoAcalmar}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── Modal de Cadastro com Ficha de Inclusão Dinâmica ────────────── */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent={true}
        onRequestClose={fecharModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.modalTitle}>Cadastrar Criança</Text>
                  <Text style={{ fontSize: 20, marginLeft: 6 }}>🎨</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  Informações seguras para nossa equipe de tios voluntários
                </Text>
              </View>

              <TouchableOpacity
                onPress={fecharModal}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Conteúdo do Formulário */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Campo: Nome da Criança */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome Completo da Criança *</Text>
                <View style={styles.inputContainer}>
                  <User size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                  <TextInput
                    value={nome}
                    onChangeText={setNome}
                    placeholder="Ex: Davi Lucas Santana"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* Linha dupla: Data de Nasc & Telefone */}
              <View style={styles.inputRow}>
                {/* Data de Nascimento */}
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Data de Nasc. *</Text>
                  <View style={styles.inputContainer}>
                    <Calendar size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                      value={dataNascimento}
                      onChangeText={(t) => setDataNascimento(formatarDataInput(t))}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={10}
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Telefone de Emergência */}
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Tel. Emergência *</Text>
                  <View style={styles.inputContainer}>
                    <Phone size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                      value={telefoneEmergencia}
                      onChangeText={(t) => setTelefoneEmergencia(formatarTelefoneInput(t))}
                      placeholder="(DD) 99999-9999"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      maxLength={15}
                      style={styles.textInput}
                    />
                  </View>
                </View>
              </View>

              {/* ─── O Grande Truque: Switch de Atenção Especial (Inclusão) ──── */}
              <View style={styles.inclusaoSwitchContainer}>
                <View style={styles.switchHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={styles.switchTitle}>Atenção Especial / Inclusão</Text>
                      <Text style={{ fontSize: 16, marginLeft: 4 }}>💛</Text>
                    </View>
                    <Text style={styles.switchDesc}>
                      Meu filho(a) precisa de atenção especial? (Autismo, TDAH, Alergias, etc.)
                    </Text>
                  </View>
                  <Switch
                    value={precisaAtencaoEspecial}
                    onValueChange={setPrecisaAtencaoEspecial}
                    trackColor={{ false: '#CBD5E1', true: '#F59E0B' }}
                    thumbColor={precisaAtencaoEspecial ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>

                {/* Bloco Condicional com Animação Suave */}
                {precisaAtencaoEspecial && (
                  <Animated.View
                    style={[
                      styles.inclusaoFormBox,
                      {
                        opacity: animInclusao,
                        transform: [
                          {
                            translateY: animInclusao.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-10, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.inclusaoAlertBox}>
                      <Info size={16} color="#D97706" style={{ marginRight: 6 }} />
                      <Text style={styles.inclusaoAlertText}>
                        Essas informações ajudam nossos tios e tias voluntários a acolher e acalmar
                        seu pequeno com amor e respeito ao tempo dele.
                      </Text>
                    </View>

                    {/* Condição / Laudo */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputSubLabel}>Condição / Laudo (Opcional)</Text>
                      <TextInput
                        value={condicao}
                        onChangeText={setCondicao}
                        placeholder="Ex: Espectro Autista (TEA), TDAH, Sensibilidade..."
                        placeholderTextColor="#94A3B8"
                        style={styles.textInputAreaSmall}
                      />
                    </View>

                    {/* Alergias ou Restrições */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputSubLabel}>Alergias ou Restrições Alimentares</Text>
                      <TextInput
                        value={alergias}
                        onChangeText={setAlergias}
                        placeholder="Ex: Leite/lactose, glúten, amendoim, picada de inseto..."
                        placeholderTextColor="#94A3B8"
                        style={styles.textInputAreaSmall}
                      />
                    </View>

                    {/* Gatilhos */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputSubLabel}>
                        Gatilhos (O que deixa a criança desconfortável?)
                      </Text>
                      <TextInput
                        value={gatilhos}
                        onChangeText={setGatilhos}
                        placeholder="Ex: Sons altos, palmas repentinas, luzes fortes, multidão..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={2}
                        style={styles.textInputArea}
                      />
                    </View>

                    {/* Regulação */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputSubLabel}>
                        Regulação (Como podemos ajudar a acalmar?)
                      </Text>
                      <TextInput
                        value={comoAcalmar}
                        onChangeText={setComoAcalmar}
                        placeholder="Ex: Cantar baixinho, dar o brinquedo preferido, levá-lo ao ar livre..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={2}
                        style={styles.textInputArea}
                      />
                    </View>
                  </Animated.View>
                )}
              </View>

              {/* Botão de Gravar */}
              <TouchableOpacity
                onPress={salvarCrianca}
                disabled={salvando}
                style={[styles.submitButton, salvando && { opacity: 0.7 }]}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#EC4899', '#DB2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {salvando ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>Salvar Cadastro com Amor</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Estilos Lúdicos com Alto Contraste ────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  pageScroll: {
    flex: 1,
  },
  pageScrollContent: {
    flexGrow: 1,
  },
  // ─── 1. Topo Visível (Sem Cortes) ─────────────────────────────────────────
  topoContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topoKidsImage: {
    width: '100%',
    height: 240,
  },
  backButtonCircle: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPillButton: {
    position: 'absolute',
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  heroPillText: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── 2. Container de Conteúdo & Card Azul de Resumo ───────────────────────
  contentContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  blueCardWrapper: {
    width: '100%',
    marginTop: 8,
    zIndex: 20,
  },
  blueCard: {
    borderRadius: 24,
    padding: 18,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  blueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  blueCardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  blueCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  blueCardDesc: {
    color: '#DBEAFE',
    fontSize: 11.5,
    lineHeight: 15,
  },
  blueCardMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  blueCardMetricColLeft: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(147, 197, 253, 0.4)',
  },
  blueCardMetricColRight: {
    flex: 1,
    alignItems: 'center',
  },
  blueMetricNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  blueMetricLabel: {
    color: '#DBEAFE',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // ─── 3. Avisos e Novidades ──────────────────────────────────────────────
  avisosContainer: {
    marginTop: 16,
    width: '100%',
    padding: 16,
    backgroundColor: '#FEFCE8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FEF08A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  avisosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avisosHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 8,
  },
  verTodosButton: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  verTodosButtonText: {
    color: '#78350F',
    fontSize: 11.5,
    fontWeight: '800',
  },
  avisosScrollContent: {
    paddingRight: 8,
    paddingVertical: 2,
  },
  avisoCard: {
    width: 270,
    marginRight: 12,
    backgroundColor: '#FFFDF7',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avisoCardEmpty: {
    backgroundColor: '#FFFDF7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoCardEmptyText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  avisoTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  avisoTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
  },
  avisoTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  avisoMensagem: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  // ─── 4. Menu de Ações Rápidas ───────────────────────────────────────────
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  quickActionCardPurple: {
    flex: 1,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIconPurple: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(233, 213, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitlePurple: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#581C87',
    textAlign: 'center',
  },
  quickActionCardGreen: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIconGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(187, 247, 208, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitleGreen: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#14532D',
    textAlign: 'center',
  },
  quickActionCardBlue: {
    flex: 1,
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIconBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(191, 219, 254, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitleBlue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },

  // ─── 5. Seção Meus Filhos ───────────────────────────────────────────────
  meusFilhosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
    marginBottom: 14,
  },
  meusFilhosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meusFilhosIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  meusFilhosTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  botaoAdicionarFilho: {
    backgroundColor: '#EC4899',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  botaoAdicionarFilhoText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    marginLeft: 5,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    width: '100%',
    paddingHorizontal: 0,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  kidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  kidCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitials: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: '800',
  },
  kidInfoCol: {
    flex: 1,
  },
  kidName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  specialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 2,
    marginBottom: 2,
  },
  specialBadgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  kidMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 12,
  },
  kidMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kidMetaText: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    marginLeft: 8,
  },
  inclusaoBox: {
    marginTop: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    overflow: 'hidden',
  },
  inclusaoToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inclusaoIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inclusaoBoxTitle: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  inclusaoExpandText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '600',
  },
  inclusaoContent: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  inclusaoField: {
    marginTop: 6,
  },
  inclusaoLabel: {
    color: '#78350F',
    fontSize: 11,
    fontWeight: '700',
  },
  inclusaoValue: {
    color: '#451A03',
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },

  // ─── Modal Styles ───────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    maxHeight: '90%',
    paddingHorizontal: 22,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  textInputAreaSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  textInputArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 56,
    textAlignVertical: 'top',
  },

  // ─── Switch de Inclusão no Modal ───────────────────────────────────────────
  inclusaoSwitchContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 16,
    marginTop: 6,
    marginBottom: 20,
  },
  switchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  switchDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
    marginTop: 2,
  },
  inclusaoFormBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  inclusaoAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  inclusaoAlertText: {
    color: '#92400E',
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },

  // ─── Botão Submeter ─────────────────────────────────────────────────────────
  submitButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

});
