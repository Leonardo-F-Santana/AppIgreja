import { useState, useEffect } from 'react';
import { ArrowRight, X, Bell, AlertTriangle } from 'lucide-react';
import { criarAviso, ouvirAvisos, type Aviso, type Prioridade } from '../services/avisosService';

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
        {/* Header do modal */}
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
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          {/* Título */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Título do Aviso
            </label>
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

          {/* Mensagem */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Conteúdo / Mensagem
            </label>
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

          {/* Prioridade */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Prioridade
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrioridade('normal')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${prioridade === 'normal'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPrioridade('alta')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${prioridade === 'alta'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <AlertTriangle size={14} />
                Urgente
              </button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !titulo.trim() || !mensagem.trim()}
              className="flex-1 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Publicando...
                </>
              ) : (
                'Publicar Aviso'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard Principal ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [ultimosAvisos, setUltimosAvisos] = useState<Aviso[]>([]);

  // Escuta os últimos avisos em tempo real para o feed de "Últimas Atividades"
  useEffect(() => {
    const unsubscribe = ouvirAvisos((avisos) => {
      setUltimosAvisos(avisos.slice(0, 3));
    });
    return () => unsubscribe();
  }, []);

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

  return (
    <>
      {/* Toast de feedback */}
      {toast && (
        <Toast
          mensagem={toast.mensagem}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de publicar aviso */}
      {isModalOpen && (
        <ModalAviso
          onClose={() => setIsModalOpen(false)}
          onPublicar={handlePublicar}
          isLoading={isLoading}
        />
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
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Membros Ativos</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">432</p>
                <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 w-max px-2.5 py-1 rounded-full">+12%</p>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                 <div className="w-1.5 bg-emerald-300 rounded-t-sm h-[40%]"></div>
                 <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[70%]"></div>
                 <div className="w-1.5 bg-gray-200 rounded-t-sm h-[50%]"></div>
                 <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[100%]"></div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Dízimos &amp; Ofertas</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">R$ 12.450</p>
                <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 w-max px-2.5 py-1 rounded-full">+5%</p>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                 <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[100%]"></div>
                 <div className="w-1.5 bg-gray-200 rounded-t-sm h-[30%]"></div>
                 <div className="w-1.5 bg-gray-200 rounded-t-sm h-[50%]"></div>
                 <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[80%]"></div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Pedidos de Oração</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">28</p>
                <p className="text-xs font-bold text-orange-600 mt-2 bg-orange-50 w-max px-2.5 py-1 rounded-full">4 urgentes</p>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                 <div className="w-1.5 bg-orange-400 rounded-t-sm h-[60%]"></div>
                 <div className="w-1.5 bg-orange-400 rounded-t-sm h-[80%]"></div>
                 <div className="w-1.5 bg-orange-400 rounded-t-sm h-[100%]"></div>
                 <div className="w-1.5 bg-gray-200 rounded-t-sm h-[40%]"></div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Eventos Mês</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-gray-900">14</p>
                <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-50 w-max px-2.5 py-1 rounded-full">2 próximos</p>
              </div>
              <div className="flex items-end gap-1.5 h-10">
                 <div className="w-1.5 bg-gray-200 rounded-t-sm h-[100%]"></div>
                 <div className="w-1.5 bg-blue-500 rounded-t-sm h-[40%]"></div>
                 <div className="w-1.5 bg-blue-500 rounded-t-sm h-[60%]"></div>
                 <div className="w-1.5 bg-blue-500 rounded-t-sm h-[90%]"></div>
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
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Nesta Semana</span>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 w-12 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ago</span>
                  <span className="text-sm font-black text-emerald-600">24</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Culto de Celebração</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Domingo, 19:00 - Templo</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 w-12 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ago</span>
                  <span className="text-sm font-black text-emerald-600">26</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Reunião de Liderança</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Terça, 20:00 - Sala 2</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 w-12 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ago</span>
                  <span className="text-sm font-black text-emerald-600">28</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Culto Jovem</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Quinta, 19:30 - Templo</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-2.5 rounded-xl border border-gray-100 text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors">
              Ver Calendário
            </button>
          </div>

          {/* Card Central: Frequência */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-gray-900 text-sm font-bold mb-4">Frequência nos Cultos</h3>
            <div className="text-center my-4">
              <span className="text-6xl font-black text-gray-900 tracking-tighter">86%</span>
            </div>
            <ul className="flex flex-col gap-3 mb-6 mt-2">
              <li className="flex justify-between items-center text-sm font-bold">
                <div className="flex items-center gap-2 text-gray-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Domingo
                </div>
                <span className="text-gray-500 font-semibold">52%</span>
              </li>
              <li className="flex justify-between items-center text-sm font-bold">
                <div className="flex items-center gap-2 text-gray-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-200"></span> Quarta
                </div>
                <span className="text-gray-500 font-semibold">22%</span>
              </li>
              <li className="flex justify-between items-center text-sm font-bold">
                <div className="flex items-center gap-2 text-gray-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span> Jovens
                </div>
                <span className="text-gray-500 font-semibold">12%</span>
              </li>
            </ul>
            <button className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors">
              Ver Detalhes
            </button>
          </div>

          {/* Card Direito: Últimas Atividades (feed em tempo real) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 text-sm font-bold">Últimos Avisos</h3>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Tempo real
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-4 justify-start">
              {ultimosAvisos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <Bell size={28} className="text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Nenhum aviso publicado ainda.</p>
                </div>
              ) : (
                ultimosAvisos.map((aviso) => (
                  <div key={aviso.id} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${aviso.prioridade === 'alta' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{aviso.titulo}</p>
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
          {/* Barras Horizontais: Células */}
          <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-center min-h-[180px]">
            <h3 className="text-gray-900 text-sm font-bold mb-6">Status de Células</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-gray-900">Engajamento Semanal</span>
                  <span className="text-xs font-extrabold text-gray-500">89%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-500 h-3 rounded-full w-[89%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-gray-900">Multiplicação (Meta Anual)</span>
                  <span className="text-xs font-extrabold text-gray-500">65%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-500 h-3 rounded-full w-[65%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner CTA */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-3xl p-8 flex flex-col justify-between min-h-[180px] shadow-sm">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Painel de<br/>Ações Rápidas</h2>
              <p className="text-emerald-100/70 text-xs font-medium max-w-[60%]">Gerencie a comunidade e conecte membros com facilidade.</p>
            </div>
            <div className="relative z-10 flex justify-between items-end mt-6">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-emerald-900 bg-emerald-800" src="https://i.pravatar.cc/100?img=12" alt="Avatar 1" />
                <img className="w-10 h-10 rounded-full border-2 border-emerald-900 bg-emerald-800" src="https://i.pravatar.cc/100?img=33" alt="Avatar 2" />
                <img className="w-10 h-10 rounded-full border-2 border-emerald-900 bg-emerald-800" src="https://i.pravatar.cc/100?img=47" alt="Avatar 3" />
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white hover:bg-gray-50 text-emerald-900 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
