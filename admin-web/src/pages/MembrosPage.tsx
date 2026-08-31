import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, UserCheck, UserCog, MoreVertical, ShieldAlert,
  Plus, Pencil, Trash2, X, Smartphone, SmartphoneNfc, Download, Clock,
  UserX, UserMinus
} from 'lucide-react';
import {
  ouvirMembros,
  atualizarFuncaoMembro,
  adicionarMembroManual,
  editarMembroManual,
  deletarMembro,
  type Membro,
  type MembroPayload,
  type RegistroHistorico,
} from '../services/membrosService';
import { ouvirCelulas, type Celula } from '../services/celulasService';
import { exportToCSV } from '../utils/exportCSV';

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
      ${tipo === 'sucesso' ? 'bg-blue-600' : 'bg-red-600'}`}
    >
      {tipo === 'sucesso' ? <UserCheck size={16} /> : <ShieldAlert size={16} />}
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(ts: Membro['createdAt']): string {
  if (!ts) return '—';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts as any);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatarTelefone(valor: string): string {
  if (!valor) return '';
  const num = valor.replace(/\D/g, '').substring(0, 11);
  
  if (num.length === 11) {
    return num.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (num.length >= 10) {
    return num.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  if (num.length > 2) {
    return num.replace(/(\d{2})(\d+)/, '($1) $2');
  }
  return num;
}

// ─── Badge de Status ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Ativo', 'Inativo', 'Afastado', 'Líder', 'Discipulador'] as const;

function renderStatusBadge(status?: string) {
  const s = (status || 'Ativo').trim();
  const lower = s.toLowerCase();

  let colorClasses: string;
  if (lower === 'ativo') {
    colorClasses = 'bg-green-100 text-green-800 border-green-200';
  } else if (lower === 'inativo' || lower === 'afastado') {
    colorClasses = 'bg-red-100 text-red-800 border-red-200';
  } else if (lower === 'líder' || lower === 'discipulador') {
    colorClasses = 'bg-blue-100 text-blue-800 border-blue-200';
  } else {
    colorClasses = 'bg-gray-100 text-gray-800 border-gray-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      {s}
    </span>
  );
}

// ─── Classes reutilizáveis do form ────────────────────────────────────────────

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider';
const required = <span className="text-red-400 ml-0.5">*</span>;

// ─── Modal de Criação / Edição ────────────────────────────────────────────────

type FormMembro = MembroPayload;

interface ModalFormProps {
  tituloModal: string;
  inicial?: FormMembro;
  onClose: () => void;
  onSalvar: (form: FormMembro) => Promise<void>;
  isLoading: boolean;
  celulasList: Celula[];
}

const FORM_VAZIO: FormMembro = {
  username: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  role: 'membro',
  celulaId: '',
  celulaNome: '',
  status: 'Ativo',
};

function ModalForm({ tituloModal, inicial, onClose, onSalvar, isLoading, celulasList }: ModalFormProps) {
  const [form, setForm] = useState<FormMembro>(inicial ?? { ...FORM_VAZIO });

  const set = <K extends keyof FormMembro>(key: K, value: FormMembro[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const formValido = form.username.trim() !== '';

  const handleCelulaChange = (celulaId: string) => {
    const celulaSelecionada = celulasList.find(c => c.id === celulaId);
    setForm(f => ({
      ...f,
      celulaId: celulaId || '',
      celulaNome: celulaSelecionada?.nome || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    await onSalvar({
      username: form.username.trim(),
      email: form.email?.trim() || '',
      telefone: form.telefone?.trim() || '',
      dataNascimento: form.dataNascimento || '',
      role: form.role,
      celulaId: form.celulaId || '',
      celulaNome: form.celulaNome || '',
      status: form.status || 'Ativo',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <Users size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">{tituloModal}</h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Gestão de Membros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Nome do Membro{required}</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              placeholder="Ex: João da Silva"
              required
              maxLength={80}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>E-mail (Opcional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="Ex: joao@email.com"
              maxLength={80}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => set('telefone', formatarTelefone(e.target.value))}
                placeholder="(99) 99999-9999"
                maxLength={20}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Data de Nascimento</label>
              <input
                type="date"
                value={form.dataNascimento || ''}
                onChange={(e) => set('dataNascimento', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Célula (Opcional)</label>
            <select
              value={form.celulaId || ''}
              onChange={(e) => handleCelulaChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Nenhuma célula</option>
              {celulasList.map((celula) => (
                <option key={celula.id} value={celula.id}>{celula.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Status</label>
            <select
              value={form.status || 'Ativo'}
              onChange={(e) => set('status', e.target.value)}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Nível de Acesso</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              required
              className={inputClass}
            >
              <option value="membro">Membro</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2 flex-shrink-0 mt-2">
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
              className="flex-1 py-3 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner /> Salvando...</> : 'Salvar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────

interface ModalConfirmacaoProps {
  nomeMembro: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  isLoading: boolean;
}

function ModalConfirmacao({ nomeMembro, onConfirmar, onCancelar, isLoading }: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg mb-1">Excluir Membro</h2>
            <p className="text-gray-500 text-sm font-medium">
              Tem certeza que deseja excluir o membro{' '}
              <span className="font-bold text-gray-700">"{nomeMembro}"</span>?
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
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Histórico (Timeline) ────────────────────────────────────────────

const TIPOS_HISTORICO_CORES: Record<string, string> = {
  'Batismo': 'bg-blue-600',
  'Mudança de Célula': 'bg-amber-500',
  'Discipulado': 'bg-purple-600',
  'Promoção': 'bg-green-600',
  'Afastamento': 'bg-red-500',
  'Retorno': 'bg-emerald-500',
  'Cadastro': 'bg-blue-600',
};

function formatarDataHistorico(dataStr: string): string {
  try {
    const date = new Date(dataStr);
    if (isNaN(date.getTime())) return dataStr;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return dataStr;
  }
}

interface ModalHistoricoProps {
  membro: Membro;
  onClose: () => void;
}

function ModalHistorico({ membro, onClose }: ModalHistoricoProps) {
  const historico: RegistroHistorico[] = membro.historico ?? [];

  // Gera um evento de cadastro a partir do createdAt se o histórico estiver vazio
  const timeline: RegistroHistorico[] = historico.length > 0
    ? [...historico].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    : [
        {
          id: 'auto-cadastro',
          data: membro.createdAt
            ? (typeof (membro.createdAt as any).toDate === 'function'
              ? (membro.createdAt as any).toDate().toISOString()
              : new Date(membro.createdAt as any).toISOString())
            : new Date().toISOString(),
          tipo: 'Cadastro',
          descricao: `${membro.username} foi registrado(a) no sistema.`,
        },
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-blue-100 p-2.5 rounded-xl flex-shrink-0">
              <Clock size={18} className="text-blue-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-gray-900 font-bold text-lg leading-tight truncate">Histórico</h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5 truncate">{membro.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-900 font-bold text-sm">Nenhum registro encontrado</p>
              <p className="text-gray-400 text-xs font-medium">O histórico deste membro está vazio.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Linha vertical */}
              <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-blue-200" />

              <div className="flex flex-col gap-6">
                {timeline.map((item, index) => {
                  const dotColor = TIPOS_HISTORICO_CORES[item.tipo] || 'bg-gray-500';
                  return (
                    <div key={item.id || index} className="relative pl-8">
                      {/* Ponto na timeline */}
                      <div
                        className={`absolute left-0 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${dotColor}`}
                      />

                      {/* Conteúdo */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900">{item.tipo}</span>
                          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                            {formatarDataHistorico(item.data)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {item.descricao}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

type ModalState =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; membro: Membro }
  | { tipo: 'excluir'; membro: Membro }
  | { tipo: 'historico'; membro: Membro };

export default function MembrosPage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroAcesso, setFiltroAcesso] = useState('todos');
  const [filtroCargo, setFiltroCargo] = useState('todos');
  const [filtroCelula, setFiltroCelula] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;
  
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  
  const [modal, setModal] = useState<ModalState>({ tipo: 'nenhum' });
  const [isSaving, setIsSaving] = useState(false);
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);
  const [celulasList, setCelulasList] = useState<Celula[]>([]);

  useEffect(() => {
    const unsubscribe = ouvirMembros((dados) => {
      setMembros(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = ouvirCelulas((dados) => {
      setCelulasList(dados);
    });
    return () => unsubscribe();
  }, []);

  const membrosFiltrados = useMemo(() => {
    return membros.filter((m) => {
      const matchBusca = m.username.toLowerCase().includes(busca.toLowerCase()) || 
                         m.email.toLowerCase().includes(busca.toLowerCase());
                         
      const matchAcesso = filtroAcesso === 'todos' ? true : 
                          filtroAcesso === 'com_app' ? m.acessoApp === true || !!m.uid :
                          m.acessoApp === false && !m.uid;
                          
      const matchCargo = filtroCargo === 'todos' ? true : m.role === filtroCargo;

      const matchCelula = filtroCelula === 'todos' ? true : m.celulaId === filtroCelula;

      const matchStatus = filtroStatus === 'todos' ? true
        : (m.status || 'Ativo').toLowerCase() === filtroStatus.toLowerCase();
      
      return matchBusca && matchAcesso && matchCargo && matchCelula && matchStatus;
    });
  }, [membros, busca, filtroAcesso, filtroCargo, filtroCelula, filtroStatus]);

  const totalPaginas = Math.ceil(membrosFiltrados.length / ITENS_POR_PAGINA);
  const membrosPaginados = membrosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroAcesso, filtroCargo, filtroCelula, filtroStatus]);

  const toggleMenu = (id: string) => {
    setMenuAbertoId(prev => prev === id ? null : id);
  };

  const closeMenu = () => setMenuAbertoId(null);

  const handleCriar = async (form: FormMembro) => {
    setIsSaving(true);
    try {
      await adicionarMembroManual(form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Membro criado com sucesso!', tipo: 'sucesso' });
    } catch (error: any) {
      if (error.message === 'DUPLICATE_EMAIL') {
        setToast({ mensagem: 'Este e-mail já está cadastrado em outro membro.', tipo: 'erro' });
      } else {
        setToast({ mensagem: 'Erro ao criar membro.', tipo: 'erro' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditar = async (form: FormMembro) => {
    if (modal.tipo !== 'editar') return;
    setIsSaving(true);
    try {
      await editarMembroManual(modal.membro.id, form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Membro atualizado com sucesso!', tipo: 'sucesso' });
    } catch (error) {
      setToast({ mensagem: 'Erro ao atualizar membro.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (modal.tipo !== 'excluir') return;
    setIsSaving(true);
    try {
      await deletarMembro(modal.membro.id);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Membro excluído.', tipo: 'sucesso' });
    } catch (error) {
      setToast({ mensagem: 'Erro ao excluir membro.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAlterarRole = async (id: string, novaRole: string) => {
    try {
      closeMenu();
      await atualizarFuncaoMembro(id, novaRole);
      setToast({ mensagem: `Função atualizada para ${novaRole === 'admin' ? 'Administrador' : 'Membro'}.`, tipo: 'sucesso' });
    } catch (error) {
      setToast({ mensagem: 'Erro ao atualizar nível de acesso.', tipo: 'erro' });
    }
  };

  return (
    <>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {/* Modais */}
      {modal.tipo === 'criar' && (
        <ModalForm
          tituloModal="Novo Membro"
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleCriar}
          isLoading={isSaving}
          celulasList={celulasList}
        />
      )}
      {modal.tipo === 'editar' && (
        <ModalForm
          tituloModal="Editar Membro"
          inicial={{
            username: modal.membro.username,
            email: modal.membro.email,
            telefone: modal.membro.telefone,
            role: modal.membro.role,
            celulaId: modal.membro.celulaId,
            celulaNome: modal.membro.celulaNome,
            status: modal.membro.status,
          }}
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleEditar}
          isLoading={isSaving}
          celulasList={celulasList}
        />
      )}
      {modal.tipo === 'excluir' && (
        <ModalConfirmacao
          nomeMembro={modal.membro.username}
          onConfirmar={handleEliminar}
          onCancelar={() => setModal({ tipo: 'nenhum' })}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'historico' && (
        <ModalHistorico
          membro={modal.membro}
          onClose={() => setModal({ tipo: 'nenhum' })}
        />
      )}

      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Membros</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gerencie os utilizadores e o cadastro geral da igreja.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                const dadosFormatados = membrosFiltrados.map(m => ({
                  'Nome': m.username,
                  'E-mail': m.email,
                  'Telefone': m.telefone ? formatarTelefone(m.telefone) : '',
                  'Célula': m.celulaNome || 'Não vinculado',
                  'Status': m.status || 'Ativo',
                  'Acesso ao App': m.acessoApp ? 'Sim' : 'Não',
                  'Nível de Acesso': m.role === 'admin' ? 'Administrador' : 'Membro',
                  'Data de Cadastro': m.createdAt
                }));
                exportToCSV(dadosFormatados, "relatorio_membros.csv");
              }}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors shadow-sm whitespace-nowrap justify-center"
            >
              <Download size={16} />
              Exportar CSV
            </button>
            <button
              onClick={() => setModal({ tipo: 'criar' })}
              className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} />
              Novo Membro
            </button>
          </div>
        </header>

        {/* Stats Cards (KPIs) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Membros</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{membros.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Ativos</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {membros.filter(m => (m.status || 'Ativo').toLowerCase() === 'ativo').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-50">
              <UserCheck size={20} className="text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Inativos</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {membros.filter(m => (m.status || '').toLowerCase() === 'inativo').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50">
              <UserX size={20} className="text-red-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Afastados</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {membros.filter(m => (m.status || '').toLowerCase() === 'afastado').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50">
              <UserMinus size={20} className="text-amber-600" />
            </div>
          </div>
        </div>

        {/* Barra de Ferramentas: Busca e Filtros */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex w-full md:w-auto gap-3 flex-wrap">
              <select
                value={filtroCelula}
                onChange={(e) => setFiltroCelula(e.target.value)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="todos">Todas as Células</option>
                {celulasList.map((celula) => (
                  <option key={celula.id} value={celula.id}>{celula.nome}</option>
                ))}
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="todos">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Afastado">Afastado</option>
                <option value="Líder">Líder</option>
                <option value="Discipulador">Discipulador</option>
              </select>

              <select
                value={filtroAcesso}
                onChange={(e) => setFiltroAcesso(e.target.value)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="todos">Todos os Acessos</option>
                <option value="com_app">Com Acesso ao App</option>
                <option value="sem_app">Sem Acesso</option>
              </select>
              
              <select
                value={filtroCargo}
                onChange={(e) => setFiltroCargo(e.target.value)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="todos">Todos os Cargos</option>
                <option value="membro">Membros</option>
                <option value="admin">Administradores</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium">Carregando lista de membros...</p>
            </div>
          </div>
        ) : membrosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4 border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Users size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-bold text-base">
                {busca ? 'Nenhum membro encontrado.' : 'Nenhum membro registrado ainda.'}
              </p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {busca ? 'Tente ajustar os termos da sua pesquisa.' : 'Clique em "+ Novo Membro" para começar.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Membro</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Célula</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acesso</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {membrosPaginados.map((membro) => {
                  const isAdmin = membro.role === 'admin';
                  const isMenuOpen = menuAbertoId === membro.id;
                  return (
                    <tr key={membro.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-700 font-bold">
                            {membro.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{membro.username}</span>
                            <span className="text-sm text-gray-500">{membro.email || '-'}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {membro.telefone ? (
                          <span className="text-sm text-gray-700">{formatarTelefone(membro.telefone)}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {membro.celulaNome ? (
                          <span className="text-sm text-gray-700 font-medium">{membro.celulaNome}</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Não vinculado</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(membro.status)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {membro.acessoApp ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Smartphone size={12} />
                            Com Acesso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                            <SmartphoneNfc size={12} />
                            Apenas Cadastro
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{formatarData(membro.createdAt)}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold 
                          ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {isAdmin ? <UserCog size={12} /> : <UserCheck size={12} />}
                          {isAdmin ? 'Administrador' : 'Membro'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right relative">
                        <button
                          onClick={() => toggleMenu(membro.id)}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* Menu Dropdown */}
                        {isMenuOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={closeMenu}
                            ></div>
                            <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                              
                              <button
                                onClick={() => {
                                  closeMenu();
                                  setModal({ tipo: 'editar', membro });
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                              >
                                <Pencil size={16} className="text-gray-400" />
                                Editar Membro
                              </button>

                              {isAdmin ? (
                                <button
                                  onClick={() => handleAlterarRole(membro.id, 'membro')}
                                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                  <UserCheck size={16} className="text-blue-500" />
                                  Tornar Membro
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAlterarRole(membro.id, 'admin')}
                                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                  <UserCog size={16} className="text-indigo-500" />
                                  Tornar Administrador
                                </button>
                              )}

                              <div className="mx-2 my-1 border-t border-gray-100"></div>

                              <button
                                onClick={() => {
                                  closeMenu();
                                  setModal({ tipo: 'historico', membro });
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                              >
                                <Clock size={16} className="text-blue-500" />
                                Histórico
                              </button>

                              <div className="mx-2 my-1 border-t border-gray-100"></div>

                              <button
                                onClick={() => {
                                  closeMenu();
                                  setModal({ tipo: 'excluir', membro });
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Excluir
                              </button>

                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Paginação no rodapé da tabela */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-lg">
              <span className="text-xs font-medium text-gray-500">
                Mostrando {membrosFiltrados.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1} a {Math.min(paginaAtual * ITENS_POR_PAGINA, membrosFiltrados.length)} de {membrosFiltrados.length} membros
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas || totalPaginas === 0}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
