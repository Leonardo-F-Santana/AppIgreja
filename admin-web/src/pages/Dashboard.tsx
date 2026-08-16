import { useState, useEffect } from 'react';
import { ArrowRight, X, Bell, AlertTriangle, Megaphone, CalendarPlus, Users, HeartHandshake, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { criarAviso, ouvirUltimosAvisos, type Prioridade, type Aviso } from '../services/avisosService';
import { ouvirResumoDashboard, type DashboardResumo } from '../services/dashboardService';
import { ouvirProximosEventos, type Evento } from '../services/eventosService';
import { ouvirCelulas, type Celula } from '../services/celulasService';
import { Timestamp, doc, setDoc, onSnapshot } from 'firebase/firestore';
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
      ${tipo === 'sucesso' ? 'bg-emerald-600' : 'bg-red-600'}`}
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
            <div className="bg-emerald-100 p-2.5 rounded-xl">
              <Bell size={18} className="text-emerald-700" />
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
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
                  ${prioridade === 'normal' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal
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
              className="flex-1 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      await criarAviso({ titulo, mensagem, prioridade, autor: 'Admin' });
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

      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

        {/* 1. Header (Topo) */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Bem-vindo, Leonardo. Aqui está o resumo de hoje.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-900 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Bell size={15} />
            Publicar Aviso
          </button>
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
                <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 w-max px-2.5 py-1 rounded-full">+12%</p>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                 <div className={`w-1.5 bg-emerald-300 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[40%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-emerald-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[70%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-gray-200 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[50%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-emerald-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[100%]' : 'h-0'}`}></div>
              </div>
            </div>
          </div>

          {/* Card 2: Dízimos (Estático) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-40">
            <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Dízimos &amp; Ofertas</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">R$ 12.450</p>
                <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 w-max px-2.5 py-1 rounded-full">+5%</p>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                 <div className={`w-1.5 bg-emerald-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[100%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-gray-200 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[30%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-gray-200 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[50%]' : 'h-0'}`}></div>
                 <div className={`w-1.5 bg-emerald-500 rounded-t-sm transition-all duration-700 ease-out origin-bottom ${animateBars ? 'h-[80%]' : 'h-0'}`}></div>
              </div>
            </div>
          </div>

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

          {/* Card 4: Eventos Mês */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-40">
            <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Eventos Mês</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {isDataLoading ? '...' : resumo.totalEventos}
                </p>
                <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-50 w-max px-2.5 py-1 rounded-full">
                  {isDataLoading ? '-' : resumo.proximosEventos.length} próximos
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Esquerdo: Próximas Atividades */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col h-full min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-900 text-sm font-bold">Próximas Atividades</h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Breve</span>
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
                        <span className="text-sm font-black text-emerald-600">{dataFormatada.day}</span>
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
            <button className="w-full mt-4 py-2.5 rounded-xl border border-gray-100 text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors">
              Ver Calendário
            </button>
          </div>

          {/* Card Central: Células */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
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
                      const cores = ["bg-emerald-500", "bg-emerald-200", "bg-gray-200"];
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
            <button className="w-full mt-auto py-2.5 rounded-xl border border-gray-200 text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors">
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
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${aviso.prioridade === 'alta' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
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

        {/* 4. Linha 3 - Status e Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" style={{ width: loadingCelulas ? '0%' : `${percentualAtivas}%` }}></div>
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

          {/* Banner CTA */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-3xl p-8 flex flex-col justify-between min-h-[180px] shadow-sm">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
            <div className="relative z-10 mb-4">
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Painel de<br/>Ações Rápidas</h2>
              <p className="text-emerald-100/70 text-xs font-medium max-w-[80%]">Atalhos essenciais para gerenciar a comunidade.</p>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-3 mt-auto">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-2xl border border-white/5 text-white text-left group shadow-sm"
              >
                <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-300 group-hover:scale-110 transition-transform">
                  <Megaphone size={16} />
                </div>
                <span className="text-xs font-bold leading-tight">Publicar<br/>Aviso</span>
              </button>

              <button
                onClick={() => navigate('/eventos')}
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-2xl border border-white/5 text-white text-left group shadow-sm"
              >
                <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-300 group-hover:scale-110 transition-transform">
                  <CalendarPlus size={16} />
                </div>
                <span className="text-xs font-bold leading-tight">Novo<br/>Evento</span>
              </button>

              <button
                onClick={() => navigate('/celulas')}
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-2xl border border-white/5 text-white text-left group shadow-sm"
              >
                <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-300 group-hover:scale-110 transition-transform">
                  <Users size={16} />
                </div>
                <span className="text-xs font-bold leading-tight">Nova<br/>Célula</span>
              </button>

              <button
                onClick={() => navigate('/pedidos')}
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-2xl border border-white/5 text-white text-left group shadow-sm"
              >
                <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-300 group-hover:scale-110 transition-transform">
                  <HeartHandshake size={16} />
                </div>
                <span className="text-xs font-bold leading-tight">Pedidos de<br/>Oração</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
