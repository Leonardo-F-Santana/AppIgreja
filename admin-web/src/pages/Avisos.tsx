import { useState, useEffect } from 'react';
import {
  Bell, Plus, Trash2, Pencil, AlertTriangle, X, Search,
  CheckCircle, Clock
} from 'lucide-react';
import {
  ouvirAvisos,
  criarAviso,
  editarAviso,
  deletarAviso,
  type Aviso,
  type Prioridade,
} from '../services/avisosService';

// ─── Badge de Prioridade ──────────────────────────────────────────────────────

function PrioridadeBadge({ prioridade }: { prioridade: Prioridade }) {
  if (prioridade === 'alta') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        <AlertTriangle size={11} />
        Urgente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
      <CheckCircle size={11} />
      Normal
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  mensagem: string;
  tipo: 'sucesso' | 'erro';
  onClose: () => void;
}

function Toast({ mensagem, tipo, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white text-sm font-semibold
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

// ─── Modal de Criação / Edição ────────────────────────────────────────────────

interface FormAviso {
  titulo: string;
  mensagem: string;
  prioridade: Prioridade;
}

interface ModalFormProps {
  inicial?: FormAviso;
  titulo: string;
  onClose: () => void;
  onSalvar: (form: FormAviso) => Promise<void>;
  isLoading: boolean;
}

function ModalForm({ inicial, titulo, onClose, onSalvar, isLoading }: ModalFormProps) {
  const [form, setForm] = useState<FormAviso>(
    inicial ?? { titulo: '', mensagem: '', prioridade: 'normal' }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.mensagem.trim()) return;
    await onSalvar(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl">
              <Bell size={18} className="text-emerald-700" />
            </div>
            <h2 className="text-gray-900 font-bold text-lg">{titulo}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: Reunião Extraordinária"
              required
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mensagem</label>
            <textarea
              value={form.mensagem}
              onChange={(e) => setForm(f => ({ ...f, mensagem: e.target.value }))}
              placeholder="Descreva o aviso em detalhes..."
              required
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{form.mensagem.length}/500</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prioridade</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, prioridade: 'normal' }))}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${form.prioridade === 'normal'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Normal
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, prioridade: 'alta' }))}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${form.prioridade === 'alta'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <AlertTriangle size={14} />
                Urgente
              </button>
            </div>
          </div>

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
              disabled={isLoading || !form.titulo.trim() || !form.mensagem.trim()}
              className="flex-1 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Salvando...
                </>
              ) : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────

interface ModalConfirmacaoProps {
  tituloAviso: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  isLoading: boolean;
}

function ModalConfirmacao({ tituloAviso, onConfirmar, onCancelar, isLoading }: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg mb-1">Excluir Aviso</h2>
            <p className="text-gray-500 text-sm font-medium">
              Tem certeza que deseja excluir <span className="font-bold text-gray-700">"{tituloAviso}"</span>? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onCancelar}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : <Trash2 size={14} />}
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(ts: Aviso['dataCriacao']): string {
  if (!ts) return '—';
  const date = ts.toDate();
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Página Principal ─────────────────────────────────────────────────────────

type ModalState =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; aviso: Aviso }
  | { tipo: 'excluir'; aviso: Aviso };

export default function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<'todos' | Prioridade>('todos');
  const [modal, setModal] = useState<ModalState>({ tipo: 'nenhum' });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Escuta em tempo real
  useEffect(() => {
    const unsubscribe = ouvirAvisos((dados) => {
      setAvisos(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtros
  const avisosFiltrados = avisos.filter((a) => {
    const matchBusca =
      a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      a.mensagem.toLowerCase().includes(busca.toLowerCase());
    const matchPrioridade = filtroPrioridade === 'todos' || a.prioridade === filtroPrioridade;
    return matchBusca && matchPrioridade;
  });

  // ── Handlers ──

  const handleCriar = async (form: FormAviso) => {
    setIsSaving(true);
    try {
      await criarAviso({ ...form, autor: 'Admin' });
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Aviso publicado com sucesso!', tipo: 'sucesso' });
    } catch {
      setToast({ mensagem: 'Erro ao publicar aviso. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditar = async (form: FormAviso) => {
    if (modal.tipo !== 'editar') return;
    setIsSaving(true);
    try {
      await editarAviso(modal.aviso.id, form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Aviso atualizado com sucesso!', tipo: 'sucesso' });
    } catch {
      setToast({ mensagem: 'Erro ao atualizar aviso. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcluir = async () => {
    if (modal.tipo !== 'excluir') return;
    setIsSaving(true);
    try {
      await deletarAviso(modal.aviso.id);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Aviso excluído.', tipo: 'sucesso' });
    } catch {
      setToast({ mensagem: 'Erro ao excluir aviso. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {/* Modais */}
      {modal.tipo === 'criar' && (
        <ModalForm
          titulo="Novo Aviso"
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleCriar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'editar' && (
        <ModalForm
          titulo="Editar Aviso"
          inicial={{ titulo: modal.aviso.titulo, mensagem: modal.aviso.mensagem, prioridade: modal.aviso.prioridade }}
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleEditar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'excluir' && (
        <ModalConfirmacao
          tituloAviso={modal.aviso.titulo}
          onConfirmar={handleExcluir}
          onCancelar={() => setModal({ tipo: 'nenhum' })}
          isLoading={isSaving}
        />
      )}

      {/* Conteúdo da Página */}
      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Avisos</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gerencie e publique comunicados para toda a comunidade.
            </p>
          </div>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="bg-emerald-900 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Aviso
          </button>
        </header>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou conteúdo..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          {/* Filtro prioridade */}
          <div className="flex gap-2">
            {(['todos', 'normal', 'alta'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroPrioridade(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border
                  ${filtroPrioridade === f
                    ? f === 'alta'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : f === 'normal'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-emerald-900 text-white border-emerald-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
              >
                {f === 'todos' ? 'Todos' : f === 'alta' ? 'Urgente' : 'Normal'}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium">Carregando avisos...</p>
            </div>
          </div>
        ) : avisosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Bell size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-bold text-base">
                {busca || filtroPrioridade !== 'todos' ? 'Nenhum aviso encontrado' : 'Nenhum aviso publicado'}
              </p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {busca || filtroPrioridade !== 'todos'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Clique em "+ Novo Aviso" para publicar o primeiro.'}
              </p>
            </div>
            {!busca && filtroPrioridade === 'todos' && (
              <button
                onClick={() => setModal({ tipo: 'criar' })}
                className="mt-2 bg-emerald-900 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Novo Aviso
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Contador */}
            <p className="text-xs font-semibold text-gray-400 px-1">
              {avisosFiltrados.length} aviso{avisosFiltrados.length !== 1 ? 's' : ''} encontrado{avisosFiltrados.length !== 1 ? 's' : ''}
            </p>

            {/* Lista de Avisos */}
            {avisosFiltrados.map((aviso) => (
              <div
                key={aviso.id}
                className={`bg-white rounded-2xl shadow-sm border-l-4 transition-shadow hover:shadow-md
                  ${aviso.prioridade === 'alta' ? 'border-l-red-500' : 'border-l-emerald-500'}`}
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Ícone */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${aviso.prioridade === 'alta' ? 'bg-red-100' : 'bg-emerald-100'}`}
                  >
                    {aviso.prioridade === 'alta'
                      ? <AlertTriangle size={18} className="text-red-600" />
                      : <Bell size={18} className="text-emerald-700" />
                    }
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-gray-900 font-bold text-sm leading-tight">{aviso.titulo}</h3>
                      <PrioridadeBadge prioridade={aviso.prioridade} />
                    </div>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-2">
                      {aviso.mensagem}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <Clock size={12} />
                        {formatarData(aviso.dataCriacao)}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        por <span className="text-gray-600 font-semibold">{aviso.autor}</span>
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <button
                      onClick={() => setModal({ tipo: 'editar', aviso })}
                      className="p-2.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="Editar aviso"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setModal({ tipo: 'excluir', aviso })}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir aviso"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
