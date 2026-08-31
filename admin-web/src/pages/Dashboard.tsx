import { useState, useEffect, useMemo } from 'react';
import { X, Bell, AlertTriangle, Megaphone, CalendarPlus, Users, HeartHandshake, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { criarAviso, ouvirUltimosAvisos, type Prioridade, type Aviso } from '../services/avisosService';
import { ouvirResumoDashboard, type DashboardResumo } from '../services/dashboardService';
import { ouvirProximosEventos, type Evento } from '../services/eventosService';
import { ouvirCelulas, type Celula } from '../services/celulasService';
import { ouvirCultos, type CultoRegistro } from '../services/cultosService';
import { Timestamp, doc, setDoc, onSnapshot, collection, query } from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── Toast ───────────────────────────────────────────────────────────────────

interface ToastProps {
  mensagem: string;
  tipo: 'sucesso' | 'erro';
  onClose: () => void;
}

function Toast({ mensagem, tipo, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white text-sm font-semibold animate-slide-in
      ${tipo === 'sucesso' ? 'bg-blue-600' : 'bg-red-600'}`}
    >
      {tipo === 'sucesso' ? <Bell size={16} /> : <AlertTriangle size={16} />}
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Modal Publicar Aviso ─────────────────────────────────────────────────────

interface ModalAvisoProps {
  onClose: () => void;
  onPublicar: (titulo: string, mensagem: string, prioridade: Prioridade) => Promise<void>;
  isLoading: boolean;
}

function ModalAviso({ onClose, onPublicar, isLoading }: ModalAvisoProps) {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('normal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) return;
    await onPublicar(titulo.trim(), mensagem.trim(), prioridade);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <Bell size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">Publicar Aviso</h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Será enviado a todos os membros</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título do Aviso</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Culto de Celebração — 25/08"
              required
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conteúdo / Mensagem</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva o aviso com detalhes importantes para a comunidade..."
              required
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{mensagem.length}/500</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prioridade</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrioridade('normal')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${prioridade === 'normal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Normal
              </button>
              <button
                type="button"
                onClick={() => setPrioridade('alta')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${prioridade === 'alta' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <AlertTriangle size={14} /> Urgente
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !titulo.trim() || !mensagem.trim()}
              className="flex-1 py-3 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? 'Publicando...' : 'Publicar Aviso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(d: any) {
  const date = d instanceof Timestamp ? d.toDate() : new Date(d);
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const day = date.getDate().toString().padStart(2, '0');
  
  const weekDayRaw = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const weekDay = weekDayRaw.charAt(0).toUpperCase() + weekDayRaw.slice(1).split('-')[0]; // ex: Domingo, Terça
  
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { month, day, weekDay, time };
}

// ─── Dashboard Principal ──────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuAcoesAberto, setMenuAcoesAberto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [proximosEventos, setProximosEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [ultimosAvisos, setUltimosAvisos] = useState<Aviso[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);
  const [dadosCelulas, setDadosCelulas] = useState<Celula[]>([]);
  const [loadingCelulas, setLoadingCelulas] = useState(true);
  const [metaAnual, setMetaAnual] = useState<number>(50);
  const [animateBars, setAnimateBars] = useState(false);

  // Estados Financeiros
  const [saldoDashboard, setSaldoDashboard] = useState<number>(0);
  const [, setTransacoes] = useState<any[]>([]);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(true);

  // Estados Membros (Aniversariantes)
  const [membros, setMembros] = useState<any[]>([]);
  const [loadingMembros, setLoadingMembros] = useState(true);

  // Estados Cultos
  const [cultos, setCultos] = useState<CultoRegistro[]>([]);
  const [loadingCultos, setLoadingCultos] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateBars(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = ouvirResumoDashboard((dados) => {
      setResumo(dados);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = ouvirProximosEventos((eventos) => {
      setProximosEventos(eventos);
      setLoadingEventos(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = ouvirUltimosAvisos((avisos) => {
      setUltimosAvisos(avisos);
      setLoadingAvisos(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = ouvirCelulas((celulas) => {
      setDadosCelulas(celulas);
      setLoadingCelulas(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'configuracoes', 'celulas'), (docSnap) => {
      if (docSnap.exists() && typeof docSnap.data().metaAnual === 'number') {
        setMetaAnual(docSnap.data().metaAnual);
      } else {
        setMetaAnual(50);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = ouvirCultos((dados) => {
      setCultos(dados);
      setLoadingCultos(false);
    });
    return () => unsubscribe();
  }, []);

  // Buscar Transações para calcular Saldo em Caixa
  useEffect(() => {
    const q = query(collection(db, 'transacoes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let saldoTotal = 0;
      const listaTransacoes: any[] = [];
      snapshot.forEach(doc => {
        const t = doc.data();
        listaTransacoes.push({ id: doc.id, ...t });
        if (t.tipo === 'entrada') saldoTotal += t.valor;
        if (t.tipo === 'saida') saldoTotal -= t.valor;
      });
      setSaldoDashboard(saldoTotal);
      setTransacoes(listaTransacoes);
      setLoadingFinanceiro(false);
    }, (error) => {
      console.error("Erro ao buscar transações no dashboard:", error);
      setLoadingFinanceiro(false);
    });

    return () => unsubscribe();
  }, []);



  // Buscar Membros para Aniversariantes
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: any[] = [];
      snapshot.forEach(doc => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setMembros(lista);
      setLoadingMembros(false);
    });
    return () => unsubscribe();
  }, []);

  // Calcular Aniversariantes do Mês
  const aniversariantesDoMes = useMemo(() => {
    const mesAtual = new Date().getMonth();
    const lista = membros.filter(m => {
      if (!m.dataNascimento) return false;
      let mesNasc = -1;
      let diaNasc = -1;
      
      if (typeof m.dataNascimento === 'string') {
        const parts = m.dataNascimento.split('/');
        if (parts.length >= 2) {
          diaNasc = parseInt(parts[0], 10);
          mesNasc = parseInt(parts[1], 10) - 1;
        } else if (m.dataNascimento.includes('-')) {
          const parts = m.dataNascimento.split('-');
          if (parts.length >= 3) {
            mesNasc = parseInt(parts[1], 10) - 1;
            diaNasc = parseInt(parts[2], 10);
          }
        }
      } else if (m.dataNascimento instanceof Timestamp || m.dataNascimento?.toDate) {
        const date = m.dataNascimento.toDate ? m.dataNascimento.toDate() : new Date(m.dataNascimento.seconds * 1000);
        mesNasc = date.getMonth();
        diaNasc = date.getDate();
      } else if (m.dataNascimento instanceof Date) {
        mesNasc = m.dataNascimento.getMonth();
        diaNasc = m.dataNascimento.getDate();
      }

      if (mesNasc === mesAtual) {
        m._diaNascTemp = diaNasc;
        return true;
      }
      return false;
    });

    return lista.sort((a, b) => (a._diaNascTemp || 0) - (b._diaNascTemp || 0));
  }, [membros]);

  // Calcular Cultos (Média e Último)
  const { mediaPresenca, totalUltimoCulto } = useMemo(() => {
    if (cultos.length === 0) return { mediaPresenca: 0, totalUltimoCulto: 0 };
    
    // Sort descending by date
    const cultosOrdenados = [...cultos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    const ultimoCulto = cultosOrdenados[0];
    const totalUltimoCulto = (ultimoCulto.adultos || 0) + (ultimoCulto.criancas || 0) + (ultimoCulto.visitantes || 0);

    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    
    const cultosMes = cultos.filter(c => {
      const d = new Date(c.data);
      const parts = c.data.split('-');
      if (parts.length === 3) {
        return parseInt(parts[1], 10) - 1 === mesAtual && parseInt(parts[0], 10) === anoAtual;
      }
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });

    if (cultosMes.length === 0) return { mediaPresenca: 0, totalUltimoCulto };

    const somaMes = cultosMes.reduce((acc, c) => acc + (c.adultos || 0) + (c.criancas || 0) + (c.visitantes || 0), 0);
    const mediaPresenca = Math.round(somaMes / cultosMes.length);

    return { mediaPresenca, totalUltimoCulto };
  }, [cultos]);

  const handleEditarMeta = async () => {
    const novaMetaStr = window.prompt('Digite a nova meta anual de células:', metaAnual.toString());
    if (novaMetaStr !== null) {
      const novaMeta = parseInt(novaMetaStr, 10);
      if (!isNaN(novaMeta) && novaMeta > 0) {
        try {
          await setDoc(doc(db, 'configuracoes', 'celulas'), { metaAnual: novaMeta }, { merge: true });
          setToast({ mensagem: 'Meta atualizada com sucesso!', tipo: 'sucesso' });
        } catch (error) {
          console.error('Erro ao atualizar meta:', error);
          setToast({ mensagem: 'Erro ao atualizar meta.', tipo: 'erro' });
        }
      } else {
        alert('Por favor, digite um número válido maior que zero.');
      }
    }
  };

  const handlePublicar = async (titulo: string, mensagem: string, prioridade: Prioridade) => {
    setIsLoading(true);
    try {
      await criarAviso({ 
        titulo, 
        mensagem, 
        prioridade, 
        criadoPor: {
          uid: user?.uid || 'unknown',
          nome: user?.nome || user?.email || 'Desconhecido',
          cargo: user?.role || 'user'
        }
      });
      setIsModalOpen(false);
      setToast({ mensagem: 'Aviso publicado com sucesso!', tipo: 'sucesso' });
    } catch (err) {
      console.error('Erro ao publicar aviso:', err);
      setToast({ mensagem: 'Erro ao publicar aviso. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsLoading(false);
    }
  };

  const isDataLoading = resumo === null;

  // Cálculos para o Status de Células
  const META_ANUAL_CELULAS = metaAnual;
  const totalCelulasMeta = dadosCelulas.length;
  // Consideramos como ativas aquelas que não têm status marcado como 'inativo'
  const celulasAtivasCount = dadosCelulas.filter(c => (c as any).status !== 'inativo').length;
  const percentualAtivas = totalCelulasMeta === 0 ? 0 : Math.round((celulasAtivasCount / totalCelulasMeta) * 100);
  const percentualMetaRaw = Math.round((totalCelulasMeta / META_ANUAL_CELULAS) * 100);
  const percentualMeta = percentualMetaRaw > 100 ? 100 : percentualMetaRaw;

  return (
    <>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {isModalOpen && (
        <ModalAviso onClose={() => setIsModalOpen(false)} onPublicar={handlePublicar} isLoading={isLoading} />
      )}

      <div className="w-full flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

        {/* 1. Header (Topo) */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Bem-vindo, Leonardo. Aqui está o resumo de hoje.</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuAcoesAberto(!menuAcoesAberto)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <span>⚡ Ações Rápidas</span>
            </button>

            {menuAcoesAberto && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl z-50 ring-1 ring-black ring-opacity-5 flex flex-col py-1 border border-gray-100">
                <button
                  onClick={() => { setIsModalOpen(true); setMenuAcoesAberto(false); }}
                  className="text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                >
                  <Megaphone size={16} className="text-blue-600" />
                  Publicar Aviso
                </button>
                <button
                  onClick={() => { navigate('/eventos'); setMenuAcoesAberto(false); }}
                  className="text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                >
                  <CalendarPlus size={16} className="text-blue-600" />
                  Novo Evento
                </button>
                <button
                  onClick={() => { navigate('/celulas'); setMenuAcoesAberto(false); }}
                  className="text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                >
                  <Users size={16} className="text-blue-600" />
                  Nova Célula
                </button>
                <button
                  onClick={() => { navigate('/pedidos'); setMenuAcoesAberto(false); }}
                  className="text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                >
                  <HeartHandshake size={16} className="text-blue-600" />
                  Pedidos de Oração
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 2. Linha 1 - Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Membros Ativos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-40">
            <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Membros Ativos</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {isDataLoading ? '...' : resumo.totalMembros}
                </p>
                <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-50 w-max px-2.5 py-1 rounded-full">+12%</p>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                 <div className={`w-1.5 bg-blue-300 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[40%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-blue-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[70%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-gray-200 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[50%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-blue-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[100%]' : 'h-0'}`}></div>
              </div>
            </div>
          </div>

          {/* Card 2: Saldo em Caixa (Dinâmico) - Restrito */}
          {['admin', 'tesouraria'].includes(user?.role || '') && (
            <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-40">
              <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Saldo em Caixa</h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {loadingFinanceiro ? 'A calcular...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoDashboard)}
                  </p>
                  <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-50 w-max px-2.5 py-1 rounded-full">+5%</p>
                </div>
                <div className="flex items-end gap-1.5 h-10">
                   <div className={`w-1.5 bg-blue-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[100%]' : 'h-0'}`}></div>
                   <div className={`w-1.5 bg-gray-200 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[30%]' : 'h-0'}`}></div>
                   <div className={`w-1.5 bg-gray-200 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[50%]' : 'h-0'}`}></div>
                   <div className={`w-1.5 bg-blue-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[80%]' : 'h-0'}`}></div>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Pedidos de Oração */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-40">
            <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Pedidos de Oração</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {isDataLoading ? '...' : resumo.totalPedidos}
                </p>
                <p className="text-xs font-bold text-orange-600 mt-2 bg-orange-50 w-max px-2.5 py-1 rounded-full">
                  {isDataLoading ? '-' : resumo.pedidosUrgentes} pendentes
                </p>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                 <div className={`w-1.5 bg-orange-400 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[60%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-orange-400 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[80%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-orange-400 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[100%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-gray-200 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[40%]' : 'h-0'}`}></div>
              </div>
            </div>
          </div>

          {/* Card 4: Média de Presença */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-40">
            <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Média de Presença</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingCultos ? '...' : mediaPresenca}
                </p>
                <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-50 w-max px-2.5 py-1 rounded-full">
                  {loadingCultos ? '-' : totalUltimoCulto} no último
                </p>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                 <div className={`w-1.5 bg-gray-200 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[100%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-blue-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[40%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-blue-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[60%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-blue-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[90%]' : 'h-0'}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Linha 2 - Análise Detalhada */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Esquerdo: Próximas Atividades */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col h-full min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-900 text-sm font-bold">Próximas Atividades</h3>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Breve</span>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {loadingEventos ? (
                 <div className="flex-1 flex items-center justify-center"><p className="text-xs text-gray-400">A carregar...</p></div>
              ) : proximosEventos.length === 0 ? (
                 <div className="flex-1 flex items-center justify-center"><p className="text-xs text-gray-400">Não há atividades agendadas.</p></div>
              ) : (
                proximosEventos.map(evento => {
                  const dataFormatada = formatEventDate(evento.dataHora);
                  return (
                    <div key={evento.id} className="flex items-center gap-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 w-12 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{dataFormatada.month}</span>
                        <span className="text-sm font-black text-blue-600">{dataFormatada.day}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">{evento.titulo}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{dataFormatada.weekDay}, {dataFormatada.time} - {evento.local}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={() => navigate('/eventos')} className="w-full mt-4 py-2.5 rounded-xl border border-gray-100 text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors">
              Ver Calendário
            </button>
          </div>

          {/* Card Central: Células */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
            <h3 className="text-gray-900 text-sm font-bold mb-4">Células por Dia da Semana</h3>
            {loadingCelulas ? (
              <div className="flex-1 flex items-center justify-center min-h-[160px]">
                <p className="text-xs text-gray-400">A carregar...</p>
              </div>
            ) : dadosCelulas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] text-center">
                <p className="text-xs text-gray-400 font-medium">Nenhuma célula cadastrada.</p>
              </div>
            ) : (
              <>
                <div className="text-center my-4 flex flex-col items-center">
                  <span className="text-6xl font-black text-gray-900 tracking-tighter">{dadosCelulas.length}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Total Ativas</span>
                </div>
                <ul className="flex flex-col gap-3 mb-6 mt-2">
                  {Object.entries(
                    dadosCelulas.reduce((acc, celula) => {
                      acc[celula.diaSemana] = (acc[celula.diaSemana] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([dia, qtd], index) => {
                      const percentual = Math.round((qtd / dadosCelulas.length) * 100);
                      const cores = ["bg-blue-500", "bg-blue-200", "bg-gray-200"];
                      const cor = cores[index] || "bg-gray-100";
                      return (
                        <li key={dia} className="flex justify-between items-center text-sm font-bold">
                          <div className="flex items-center gap-2 text-gray-900">
                            <span className={`w-2.5 h-2.5 rounded-full ${cor}`}></span> {dia.split('-')[0]}
                          </div>
                          <span className="text-gray-500 font-semibold">{percentual}%</span>
                        </li>
                      );
                    })}
                </ul>
              </>
            )}
            <button onClick={() => navigate('/celulas')} className="w-full mt-auto py-2.5 rounded-xl border border-gray-200 text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors">
              Ver Detalhes
            </button>
          </div>

          {/* Card Direito: Últimas Atividades (Avisos) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col h-full min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 text-sm font-bold">Últimos Avisos</h3>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Tempo real
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-4 justify-start">
              {loadingAvisos ? (
                 <div className="flex-1 flex items-center justify-center"><p className="text-xs text-gray-400">A carregar...</p></div>
              ) : ultimosAvisos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <Bell size={28} className="text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Nenhum aviso publicado recentemente.</p>
                </div>
              ) : (
                ultimosAvisos.map((aviso) => (
                  <div key={aviso.id} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${aviso.prioridade === 'alta' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">{aviso.titulo}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5 line-clamp-1">{aviso.mensagem}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 4. Linha 3 - Bloco Inferior */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Aniversariantes do Mês */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col min-h-[180px] max-h-[350px]">
            <h3 className="text-gray-900 text-sm font-bold mb-4 flex items-center gap-2">
              🎂 Aniversariantes do Mês
            </h3>
            <div className="flex-1 overflow-y-auto pr-1">
              {loadingMembros ? (
                <div className="flex-1 flex items-center justify-center min-h-[100px]"><p className="text-xs text-gray-400">A carregar...</p></div>
              ) : aniversariantesDoMes.length === 0 ? (
                <div className="flex-1 flex items-center justify-center min-h-[100px] text-center">
                  <p className="text-xs text-gray-400 font-medium">Nenhum aniversariante para este mês.</p>
                </div>
              ) : (
                <ul className="flex flex-col">
                  {aniversariantesDoMes.map(m => {
                    const diaAtual = new Date().getDate();
                    const isHoje = parseInt(m._diaNascTemp) === diaAtual;
                    const numeroLimpo = m.telefone ? m.telefone.replace(/\D/g, '') : '';
                    const linkWhatsApp = numeroLimpo ? `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent('Paz do Senhor! Passando para te desejar um feliz aniversário e que Deus te abençoe grandemente!')}` : '#';
                    return (
                      <li key={m.id} className={`flex items-center justify-between ${isHoje ? 'bg-amber-50 border border-amber-200 rounded-md p-2 mb-2 mt-1' : 'py-2.5 border-b border-gray-100 last:border-0'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                            {m.username ? m.username.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-1" title={m.username}>{m.username || 'Sem Nome'}</p>
                              {isHoje && (
                                <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">🎉 Hoje!</span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-gray-500 mt-0.5">Dia {m._diaNascTemp}</p>
                          </div>
                        </div>
                        {numeroLimpo && (
                          <button 
                            onClick={() => window.open(linkWhatsApp, '_blank')}
                            className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                            title="Enviar parabéns no WhatsApp"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-blue-600">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                            </svg>
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Barras Horizontais: Células (Dinâmico) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-center min-h-[180px]">
            <h3 className="text-gray-900 text-sm font-bold mb-6">Status de Células</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-gray-900">Células Ativas</span>
                  <span className="text-xs font-extrabold text-gray-500">{loadingCelulas ? '-' : `${percentualAtivas}%`}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: loadingCelulas ? '0%' : `${percentualAtivas}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">Multiplicação (Meta: {metaAnual})</span>
                    <Edit2 size={14} className="text-gray-400 hover:text-blue-500 cursor-pointer" onClick={handleEditarMeta} />
                  </div>
                  <span className="text-xs font-extrabold text-gray-500">{loadingCelulas ? '-' : `${percentualMeta}%`}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: loadingCelulas ? '0%' : `${percentualMeta}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
