import { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, Pencil, X, Search,
  MapPin, Clock, User, AlertTriangle, BookOpen,
} from 'lucide-react';
import {
  ouvirCelulas,
  criarCelula,
  editarCelula,
  deletarCelula,
  DIAS_SEMANA,
  type Celula,
  type CriarCelulaPayload,
  type DiaSemana,
} from '../services/celulasService';

// ─── Spinner ──────────────────────────────────────────────────────────────────

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
      ${tipo === 'sucesso' ? 'bg-emerald-600' : 'bg-red-600'}`}
    >
      {tipo === 'sucesso' ? <Users size={16} /> : <AlertTriangle size={16} />}
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Classes reutilizáveis do form ────────────────────────────────────────────

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider';
const required = <span className="text-red-400 ml-0.5">*</span>;

// ─── Modal de Criação / Edição ────────────────────────────────────────────────

type FormCelula = CriarCelulaPayload;

interface ModalFormProps {
  tituloModal: string;
  inicial?: FormCelula;
  onClose: () => void;
  onSalvar: (form: FormCelula) => Promise<void>;
  isLoading: boolean;
}

const FORM_VAZIO: FormCelula = {
  nome: '',
  lider: '',
  diaSemana: 'Quarta-feira',
  horario: '20:00',
  endereco: '',
  bairro: '',
};

function ModalForm({ tituloModal, inicial, onClose, onSalvar, isLoading }: ModalFormProps) {
  const [form, setForm] = useState<FormCelula>(inicial ?? { ...FORM_VAZIO });

  const set = <K extends keyof FormCelula>(key: K, value: FormCelula[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const formValido =
    form.nome.trim() !== '' &&
    form.lider.trim() !== '' &&
    form.horario !== '' &&
    form.bairro.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    await onSalvar({
      nome: form.nome.trim(),
      lider: form.lider.trim(),
      diaSemana: form.diaSemana,
      horario: form.horario,
      endereco: form.endereco.trim(),
      bairro: form.bairro.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header do modal */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl">
              <Users size={18} className="text-emerald-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">{tituloModal}</h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Coleção: celulas</p>
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
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5 overflow-y-auto">

          {/* Nome da Célula */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Nome da Célula{required}</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder='Ex: Célula Betel, Célula Shalom...'
              required
              maxLength={80}
              className={inputClass}
            />
          </div>

          {/* Líder */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Nome do Líder{required}</label>
            <input
              type="text"
              value={form.lider}
              onChange={(e) => set('lider', e.target.value)}
              placeholder="Ex: João e Maria Silva"
              required
              maxLength={80}
              className={inputClass}
            />
          </div>

          {/* Dia + Horário em linha */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Dia da Semana{required}</label>
              <select
                value={form.diaSemana}
                onChange={(e) => set('diaSemana', e.target.value as DiaSemana)}
                required
                className={inputClass}
              >
                {DIAS_SEMANA.map((dia) => (
                  <option key={dia} value={dia}>{dia}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Horário{required}</label>
              <input
                type="time"
                value={form.horario}
                onChange={(e) => set('horario', e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Bairro{required}</label>
            <input
              type="text"
              value={form.bairro}
              onChange={(e) => set('bairro', e.target.value)}
              placeholder="Ex: Centro, Jardim América, Vila Nova..."
              required
              maxLength={80}
              className={inputClass}
            />
          </div>

          {/* Endereço completo */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Endereço Completo</label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => set('endereco', e.target.value)}
              placeholder="Ex: Rua das Flores, 123 — apto 4B"
              maxLength={160}
              className={inputClass}
            />
            <p className="text-xs text-gray-400">Opcional, mas ajuda os membros a localizarem.</p>
          </div>

          {/* Botões de ação */}
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
              className="flex-1 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner /> Salvando...</> : 'Salvar Célula'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────

interface ModalConfirmacaoProps {
  nomeCelula: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  isLoading: boolean;
}

function ModalConfirmacao({ nomeCelula, onConfirmar, onCancelar, isLoading }: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg mb-1">Eliminar Célula</h2>
            <p className="text-gray-500 text-sm font-medium">
              Tem certeza que deseja eliminar{' '}
              <span className="font-bold text-gray-700">"{nomeCelula}"</span>?
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

// ─── Card de Célula ───────────────────────────────────────────────────────────

// Paleta de cores cíclica para os avatares/destaque dos cards
const PALETA = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',    ring: 'ring-blue-200' },
  { bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-500',  ring: 'ring-violet-200' },
  { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500',  ring: 'ring-orange-200' },
  { bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500',    ring: 'ring-rose-200' },
  { bg: 'bg-cyan-100',    text: 'text-cyan-700',    dot: 'bg-cyan-500',    ring: 'ring-cyan-200' },
];

function getCor(index: number) {
  return PALETA[index % PALETA.length];
}

/** Abrevia o nome da célula para exibição no avatar (ex: "CB" para "Célula Betel") */
function getIniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

interface CelulaCardProps {
  celula: Celula;
  index: number;
  onEditar: () => void;
  onEliminar: () => void;
}

function CelulaCard({ celula, index, onEditar, onEliminar }: CelulaCardProps) {
  const cor = getCor(index);
  const iniciais = getIniciais(celula.nome);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden hover:shadow-md transition-shadow group">

      {/* Cabeçalho do card: avatar + nome */}
      <div className="p-5 pb-4 flex items-start gap-4">
        {/* Avatar com iniciais */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cor.bg} ring-2 ${cor.ring}`}>
          <span className={`text-sm font-black ${cor.text}`}>{iniciais}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-bold text-base leading-tight truncate">
            {celula.nome}
          </h3>
          {/* Indicador de dia */}
          <span className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cor.bg} ${cor.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cor.dot}`} />
            {celula.diaSemana}
          </span>
        </div>
      </div>

      {/* Separador */}
      <div className="mx-5 border-t border-gray-50" />

      {/* Detalhes */}
      <div className="px-5 py-4 flex flex-col gap-2.5 flex-1">
        {/* Líder */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-gray-400" />
          </div>
          <span className="text-sm font-semibold text-gray-700 truncate">{celula.lider}</span>
        </div>

        {/* Dia e Horário */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Clock size={13} className="text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-500">
            {celula.diaSemana} às {celula.horario}
          </span>
        </div>

        {/* Bairro */}
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin size={13} className="text-gray-400" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-700 block truncate">{celula.bairro}</span>
            {celula.endereco && (
              <span className="text-xs font-medium text-gray-400 block truncate mt-0.5">{celula.endereco}</span>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé com ações */}
      <div className="px-5 pb-4 pt-3 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <BookOpen size={12} />
          <span>Célula ativa</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEditar}
            className="p-2 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
            title="Editar célula"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onEliminar}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Eliminar célula"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Estado Vazio ─────────────────────────────────────────────────────────────

function EmptyState({ filtrado, onNova }: { filtrado: boolean; onNova: () => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
        <Users size={28} className="text-emerald-300" />
      </div>
      <div className="text-center">
        <p className="text-gray-900 font-bold text-base">
          {filtrado ? 'Nenhuma célula encontrada' : 'Nenhuma célula cadastrada'}
        </p>
        <p className="text-gray-400 text-sm font-medium mt-1">
          {filtrado
            ? 'Tente ajustar os termos de busca.'
            : 'Clique em "+ Nova Célula" para começar.'}
        </p>
      </div>
      {!filtrado && (
        <button
          onClick={onNova}
          className="mt-2 bg-emerald-900 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Nova Célula
        </button>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

type ModalState =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; celula: Celula }
  | { tipo: 'excluir'; celula: Celula };

export default function CelulasPage() {
  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroDia, setFiltroDia] = useState<'todos' | DiaSemana>('todos');
  const [modal, setModal] = useState<ModalState>({ tipo: 'nenhum' });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Subscrição em tempo real
  useEffect(() => {
    const unsubscribe = ouvirCelulas((dados) => {
      setCelulas(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtros
  const celulasFiltradas = celulas.filter((c) => {
    const matchBusca =
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.lider.toLowerCase().includes(busca.toLowerCase()) ||
      c.bairro.toLowerCase().includes(busca.toLowerCase()) ||
      c.endereco.toLowerCase().includes(busca.toLowerCase());
    const matchDia = filtroDia === 'todos' || c.diaSemana === filtroDia;
    return matchBusca && matchDia;
  });

  // Dias únicos presentes para o filtro dinâmico
  const diasPresentes = Array.from(new Set(celulas.map((c) => c.diaSemana)));

  // ── Handlers ──

  const handleCriar = async (form: FormCelula) => {
    setIsSaving(true);
    try {
      await criarCelula(form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Célula criada com sucesso!', tipo: 'sucesso' });
    } catch (err) {
      console.error('[CelulasPage] Erro ao criar:', err);
      setToast({ mensagem: 'Erro ao criar célula. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditar = async (form: FormCelula) => {
    if (modal.tipo !== 'editar') return;
    setIsSaving(true);
    try {
      await editarCelula(modal.celula.id, form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Célula atualizada com sucesso!', tipo: 'sucesso' });
    } catch (err) {
      console.error('[CelulasPage] Erro ao editar:', err);
      setToast({ mensagem: 'Erro ao atualizar célula. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (modal.tipo !== 'excluir') return;
    setIsSaving(true);
    try {
      await deletarCelula(modal.celula.id);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Célula eliminada.', tipo: 'sucesso' });
    } catch (err) {
      console.error('[CelulasPage] Erro ao eliminar:', err);
      setToast({ mensagem: 'Erro ao eliminar célula. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  // Alias de tipo para o form usado internamente
  type FormCelula = CriarCelulaPayload;

  return (
    <>
      {/* Toast */}
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {/* Modais */}
      {modal.tipo === 'criar' && (
        <ModalForm
          tituloModal="Nova Célula"
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleCriar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'editar' && (
        <ModalForm
          tituloModal="Editar Célula"
          inicial={{
            nome: modal.celula.nome,
            lider: modal.celula.lider,
            diaSemana: modal.celula.diaSemana,
            horario: modal.celula.horario,
            endereco: modal.celula.endereco,
            bairro: modal.celula.bairro,
          }}
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleEditar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'excluir' && (
        <ModalConfirmacao
          nomeCelula={modal.celula.nome}
          onConfirmar={handleEliminar}
          onCancelar={() => setModal({ tipo: 'nenhum' })}
          isLoading={isSaving}
        />
      )}

      {/* Conteúdo da página */}
      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Células</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gerencie as células da comunidade e ajude os membros a encontrar a sua.
            </p>
          </div>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="bg-emerald-900 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Nova Célula
          </button>
        </header>

        {/* Barra de filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Campo de busca */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, líder ou bairro..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filtro por dia da semana */}
          {diasPresentes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroDia('todos')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border
                  ${filtroDia === 'todos'
                    ? 'bg-emerald-900 text-white border-emerald-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
              >
                Todos
              </button>
              {diasPresentes.map((dia) => (
                <button
                  key={dia}
                  onClick={() => setFiltroDia(dia)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border
                    ${filtroDia === dia
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                >
                  {dia.split('-')[0]} {/* Exibe só "Segunda", "Terça" etc. */}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conteúdo principal */}
        {carregando ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium">Carregando células...</p>
            </div>
          </div>
        ) : celulasFiltradas.length === 0 ? (
          <EmptyState
            filtrado={busca !== '' || filtroDia !== 'todos'}
            onNova={() => setModal({ tipo: 'criar' })}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Resumo */}
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-gray-400">
                {celulasFiltradas.length} célula{celulasFiltradas.length !== 1 ? 's' : ''} encontrada{celulasFiltradas.length !== 1 ? 's' : ''}
              </p>
              {celulas.length > 0 && (
                <p className="text-xs font-semibold text-gray-400">
                  Total: {celulas.length} célula{celulas.length !== 1 ? 's' : ''} cadastrada{celulas.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {celulasFiltradas.map((celula) => (
                <CelulaCard
                  key={celula.id}
                  celula={celula}
                  index={celulas.indexOf(celula)}
                  onEditar={() => setModal({ tipo: 'editar', celula })}
                  onEliminar={() => setModal({ tipo: 'excluir', celula })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
