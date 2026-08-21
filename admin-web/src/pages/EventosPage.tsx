import { useState, useEffect } from 'react';
import {
  Calendar, Plus, Trash2, Pencil, X, Search,
  MapPin, Clock, AlertTriangle,
} from 'lucide-react';
import {
  ouvirEventos,
  criarEvento,
  editarEvento,
  deletarEvento,
  type Evento,
  type CriarEventoPayload,
} from '../services/eventosService';

// ─── Helpers de Data ──────────────────────────────────────────────────────────

/**
 * Converte uma string ISO (datetime-local) para exibição legível.
 * Ex: "2026-08-24T19:00" → "24 ago. 2026, 19:00"
 */
function formatarDataHora(iso: string): string {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Verifica se o evento já passou.
 */
function eventoPassou(iso: string): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

/**
 * Retorna valor padrão para o datetime-local (próxima hora cheia).
 */
function getDefaultDatetimeLocal(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  // Formato: "YYYY-MM-DDTHH:MM" sem segundos/timezone
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
}

// ─── Spinner inline ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
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
      ${tipo === 'sucesso' ? 'bg-blue-600' : 'bg-red-600'}`}
    >
      {tipo === 'sucesso' ? <Calendar size={16} /> : <AlertTriangle size={16} />}
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Modal de Criação / Edição ────────────────────────────────────────────────

interface FormEvento {
  titulo: string;
  descricao: string;
  dataHora: string;
  local: string;
}

interface ModalFormProps {
  tituloModal: string;
  inicial?: FormEvento;
  onClose: () => void;
  onSalvar: (form: FormEvento) => Promise<void>;
  isLoading: boolean;
}

function ModalForm({ tituloModal, inicial, onClose, onSalvar, isLoading }: ModalFormProps) {
  const [form, setForm] = useState<FormEvento>(
    inicial ?? {
      titulo: '',
      descricao: '',
      dataHora: getDefaultDatetimeLocal(),
      local: '',
    }
  );

  const formValido =
    form.titulo.trim() !== '' &&
    form.dataHora !== '' &&
    form.local.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    await onSalvar(form);
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <Calendar size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">{tituloModal}</h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Coleção: eventos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5 overflow-y-auto">
          {/* Título */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Título do Evento <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: Culto de Celebração — Agosto 2026"
              required
              maxLength={120}
              className={inputClass}
            />
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Detalhes sobre o evento, programação, observações..."
              maxLength={600}
              rows={3}
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-gray-400 text-right">{form.descricao.length}/600</p>
          </div>

          {/* Data e Hora */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Data e Hora <span className="text-red-400">*</span></label>
            <input
              type="datetime-local"
              value={form.dataHora}
              onChange={(e) => setForm(f => ({ ...f, dataHora: e.target.value }))}
              required
              className={inputClass}
            />
          </div>

          {/* Local */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Localização <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.local}
              onChange={(e) => setForm(f => ({ ...f, local: e.target.value }))}
              placeholder="Ex: Templo Principal, Sede, Sala 2..."
              required
              maxLength={100}
              className={inputClass}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !formValido}
              className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner /> Salvando...</> : 'Salvar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────

interface ModalConfirmacaoProps {
  tituloEvento: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  isLoading: boolean;
}

function ModalConfirmacao({ tituloEvento, onConfirmar, onCancelar, isLoading }: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg mb-1">Eliminar Evento</h2>
            <p className="text-gray-500 text-sm font-medium">
              Tem certeza que deseja eliminar{' '}
              <span className="font-bold text-gray-700">"{tituloEvento}"</span>?
              Esta ação não pode ser desfeita.
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
              {isLoading ? <Spinner /> : <Trash2 size={14} />}
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card de Evento ───────────────────────────────────────────────────────────

interface EventoCardProps {
  evento: Evento;
  onEditar: () => void;
  onEliminar: () => void;
}

function EventoCard({ evento, onEditar, onEliminar }: EventoCardProps) {
  const passou = eventoPassou(evento.dataHora);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group overflow-hidden
        ${passou ? 'opacity-60' : ''}`}
    >
      {/* Faixa superior colorida */}
      <div className={`h-1.5 w-full ${passou ? 'bg-gray-300' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`} />

      <div className="p-5">
        {/* Linha topo: título + status + ações */}
        <div className="flex items-start gap-3 mb-3">
          {/* Ícone */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
            ${passou ? 'bg-gray-100' : 'bg-blue-100'}`}
          >
            <Calendar size={18} className={passou ? 'text-gray-400' : 'text-blue-700'} />
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h3 className="text-gray-900 font-bold text-sm leading-snug">{evento.titulo}</h3>
              {passou && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">
                  Realizado
                </span>
              )}
            </div>
            {evento.descricao && (
              <p className="text-gray-400 text-xs font-medium leading-relaxed line-clamp-2">
                {evento.descricao}
              </p>
            )}
          </div>

          {/* Botões de ação — visíveis ao hover */}
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEditar}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="Editar evento"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={onEliminar}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Eliminar evento"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Metadados: data e local */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 pt-3 border-t border-gray-50">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Clock size={12} className={passou ? 'text-gray-300' : 'text-blue-400'} />
            {formatarDataHora(evento.dataHora)}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <MapPin size={12} className={passou ? 'text-gray-300' : 'text-blue-400'} />
            {evento.local || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Estado Vazio ─────────────────────────────────────────────────────────────

function EmptyState({ filtrado, onNovo }: { filtrado: boolean; onNovo: () => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
        <Calendar size={28} className="text-blue-300" />
      </div>
      <div className="text-center">
        <p className="text-gray-900 font-bold text-base">
          {filtrado ? 'Nenhum evento encontrado' : 'Nenhum evento cadastrado'}
        </p>
        <p className="text-gray-400 text-sm font-medium mt-1">
          {filtrado
            ? 'Tente ajustar os filtros de busca.'
            : 'Clique em "+ Novo Evento" para criar o primeiro.'}
        </p>
      </div>
      {!filtrado && (
        <button
          onClick={onNovo}
          className="mt-2 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Evento
        </button>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

type ModalState =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; evento: Evento }
  | { tipo: 'excluir'; evento: Evento };

type FiltroStatus = 'todos' | 'proximos' | 'realizados';

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [modal, setModal] = useState<ModalState>({ tipo: 'nenhum' });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Subscrição em tempo real
  useEffect(() => {
    const unsubscribe = ouvirEventos((dados) => {
      setEventos(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtros
  const eventosFiltrados = eventos.filter((e) => {
    const matchBusca =
      e.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      e.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      e.local.toLowerCase().includes(busca.toLowerCase());

    const passou = eventoPassou(e.dataHora);
    const matchStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'proximos' && !passou) ||
      (filtroStatus === 'realizados' && passou);

    return matchBusca && matchStatus;
  });

  // Contadores para as abas
  const totalProximos = eventos.filter(e => !eventoPassou(e.dataHora)).length;
  const totalRealizados = eventos.filter(e => eventoPassou(e.dataHora)).length;

  // ── Handlers ──

  const handleCriar = async (form: FormEvento) => {
    setIsSaving(true);
    try {
      const payload: CriarEventoPayload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        dataHora: form.dataHora,
        local: form.local.trim(),
      };
      await criarEvento(payload);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Evento criado com sucesso!', tipo: 'sucesso' });
    } catch (err) {
      console.error('[EventosPage] Erro ao criar evento:', err);
      setToast({ mensagem: 'Erro ao criar evento. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditar = async (form: FormEvento) => {
    if (modal.tipo !== 'editar') return;
    setIsSaving(true);
    try {
      await editarEvento(modal.evento.id, {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        dataHora: form.dataHora,
        local: form.local.trim(),
      });
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Evento atualizado com sucesso!', tipo: 'sucesso' });
    } catch (err) {
      console.error('[EventosPage] Erro ao editar evento:', err);
      setToast({ mensagem: 'Erro ao atualizar evento. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (modal.tipo !== 'excluir') return;
    setIsSaving(true);
    try {
      await deletarEvento(modal.evento.id);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Evento eliminado.', tipo: 'sucesso' });
    } catch (err) {
      console.error('[EventosPage] Erro ao eliminar evento:', err);
      setToast({ mensagem: 'Erro ao eliminar evento. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const filtros: { label: string; value: FiltroStatus; count?: number }[] = [
    { label: 'Todos', value: 'todos', count: eventos.length },
    { label: 'Próximos', value: 'proximos', count: totalProximos },
    { label: 'Realizados', value: 'realizados', count: totalRealizados },
  ];

  return (
    <>
      {/* Toast */}
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {/* Modais */}
      {modal.tipo === 'criar' && (
        <ModalForm
          tituloModal="Novo Evento"
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleCriar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'editar' && (
        <ModalForm
          tituloModal="Editar Evento"
          inicial={{
            titulo: modal.evento.titulo,
            descricao: modal.evento.descricao,
            dataHora: modal.evento.dataHora,
            local: modal.evento.local,
          }}
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleEditar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'excluir' && (
        <ModalConfirmacao
          tituloEvento={modal.evento.titulo}
          onConfirmar={handleEliminar}
          onCancelar={() => setModal({ tipo: 'nenhum' })}
          isLoading={isSaving}
        />
      )}

      {/* Conteúdo */}
      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Eventos</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gerencie a programação e os eventos da comunidade.
            </p>
          </div>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Evento
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
              placeholder="Buscar por título, local ou descrição..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Abas de status */}
          <div className="flex gap-2">
            {filtros.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltroStatus(f.value)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5
                  ${filtroStatus === f.value
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black
                    ${filtroStatus === f.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo principal */}
        {carregando ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium">Carregando eventos...</p>
            </div>
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <EmptyState
            filtrado={busca !== '' || filtroStatus !== 'todos'}
            onNovo={() => setModal({ tipo: 'criar' })}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Contador */}
            <p className="text-xs font-semibold text-gray-400 px-1">
              {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''} encontrado{eventosFiltrados.length !== 1 ? 's' : ''}
            </p>

            {/* Grid responsivo de cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {eventosFiltrados.map((evento) => (
                <EventoCard
                  key={evento.id}
                  evento={evento}
                  onEditar={() => setModal({ tipo: 'editar', evento })}
                  onEliminar={() => setModal({ tipo: 'excluir', evento })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}


