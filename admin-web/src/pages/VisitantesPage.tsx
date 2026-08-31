import { useState, useEffect, useMemo } from 'react';
import {
  UserPlus, Search, Plus, Pencil, Trash2, X, Users
} from 'lucide-react';
import {
  ouvirVisitantes,
  adicionarVisitante,
  editarVisitante,
  deletarVisitante,
  type Visitante,
} from '../services/visitantesService';

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
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

function formatarData(dataISO: string): string {
  if (!dataISO) return '—';
  const parts = dataISO.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataISO;
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

function renderStatusBadge(status: string) {
  const s = (status || 'Novo').trim();
  const lower = s.toLowerCase();

  let colorClasses = 'bg-gray-100 text-gray-800 border-gray-200';
  if (lower === 'novo') {
    colorClasses = 'bg-blue-100 text-blue-800 border-blue-200';
  } else if (lower === 'em contato') {
    colorClasses = 'bg-amber-100 text-amber-800 border-amber-200';
  } else if (lower === 'consolidado') {
    colorClasses = 'bg-green-100 text-green-800 border-green-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      {s}
    </span>
  );
}

// ─── Classes reutilizáveis do form (Touch-Friendly) ───────────────────────────
const inputClass =
  'w-full px-4 py-3 md:py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-base md:text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider';
const required = <span className="text-red-400 ml-0.5">*</span>;

// ─── Modal de Criação / Edição ────────────────────────────────────────────────
type FormVisitante = Omit<Visitante, 'id' | 'createdAt'>;

interface ModalFormProps {
  tituloModal: string;
  inicial?: FormVisitante;
  onClose: () => void;
  onSalvar: (form: FormVisitante) => Promise<void>;
  isLoading: boolean;
}

const FORM_VAZIO: FormVisitante = {
  nome: '',
  telefone: '',
  dataVisita: new Date().toISOString().split('T')[0],
  quemConvidou: '',
  status: 'Novo',
};

const STATUS_OPCOES = ['Novo', 'Em Contato', 'Consolidado'];

function ModalForm({ tituloModal, inicial, onClose, onSalvar, isLoading }: ModalFormProps) {
  const [form, setForm] = useState<FormVisitante>(inicial ?? { ...FORM_VAZIO });

  const set = <K extends keyof FormVisitante>(key: K, value: FormVisitante[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.dataVisita) return;
    await onSalvar({
      nome: form.nome.trim(),
      telefone: form.telefone,
      dataVisita: form.dataVisita,
      quemConvidou: form.quemConvidou?.trim() || '',
      status: form.status,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 md:px-8 md:py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <UserPlus size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">{tituloModal}</h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Gestão de Visitantes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 -mr-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 md:px-8 md:py-6 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Nome Completo{required}</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex: Maria Silva"
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Telefone / WhatsApp</label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => set('telefone', formatarTelefone(e.target.value))}
              placeholder="(99) 99999-9999"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Data da Visita{required}</label>
            <input
              type="date"
              value={form.dataVisita}
              onChange={(e) => set('dataVisita', e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Quem Convidou?</label>
            <input
              type="text"
              value={form.quemConvidou}
              onChange={(e) => set('quemConvidou', e.target.value)}
              placeholder="Ex: João (Célula Centro)"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className={inputClass}
            >
              {STATUS_OPCOES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4 flex-shrink-0 mt-2 pb-4 md:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 md:py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-base md:text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !form.nome.trim() || !form.dataVisita}
              className="flex-1 py-4 md:py-3 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-bold text-base md:text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner /> Salvando...</> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────
interface ModalConfirmacaoProps {
  nomeVisitante: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  isLoading: boolean;
}

function ModalConfirmacao({ nomeVisitante, onConfirmar, onCancelar, isLoading }: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        <div className="px-6 py-8 md:px-8 md:py-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 md:w-14 md:h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={28} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-xl md:text-lg mb-1">Excluir Visitante</h2>
            <p className="text-gray-500 text-base md:text-sm font-medium">
              Tem certeza que deseja excluir o registro de{' '}
              <span className="font-bold text-gray-700">"{nomeVisitante}"</span>?
            </p>
          </div>
          <div className="flex gap-3 w-full pt-4 pb-4 md:pb-0">
            <button
              onClick={onCancelar}
              className="flex-1 py-4 md:py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-base md:text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={isLoading}
              className="flex-1 py-4 md:py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-base md:text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? <Spinner /> : <Trash2 size={18} />}
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

type ModalState =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; visitante: Visitante }
  | { tipo: 'excluir'; visitante: Visitante };

export default function VisitantesPage() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;
  
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  
  const [modal, setModal] = useState<ModalState>({ tipo: 'nenhum' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = ouvirVisitantes((dados) => {
      setVisitantes(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  const visitantesFiltrados = useMemo(() => {
    return visitantes.filter((v) => {
      const termo = busca.toLowerCase();
      return v.nome.toLowerCase().includes(termo) || v.telefone.includes(termo);
    });
  }, [visitantes, busca]);

  const totalPaginas = Math.ceil(visitantesFiltrados.length / ITENS_POR_PAGINA);
  const visitantesPaginados = visitantesFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca]);

  const handleCriar = async (form: FormVisitante) => {
    setIsSaving(true);
    try {
      await adicionarVisitante(form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Visitante salvo com sucesso!', tipo: 'sucesso' });
    } catch (error: any) {
      setToast({ mensagem: 'Erro ao salvar registro.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditar = async (form: FormVisitante) => {
    if (modal.tipo !== 'editar' || !modal.visitante.id) return;
    setIsSaving(true);
    try {
      await editarVisitante(modal.visitante.id, form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Visitante atualizado com sucesso!', tipo: 'sucesso' });
    } catch (error) {
      setToast({ mensagem: 'Erro ao atualizar registro.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (modal.tipo !== 'excluir' || !modal.visitante.id) return;
    setIsSaving(true);
    try {
      await deletarVisitante(modal.visitante.id);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Visitante excluído.', tipo: 'sucesso' });
    } catch (error) {
      setToast({ mensagem: 'Erro ao excluir registro.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {/* Modais */}
      {modal.tipo === 'criar' && (
        <ModalForm
          tituloModal="Novo Visitante"
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleCriar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'editar' && (
        <ModalForm
          tituloModal="Editar Visitante"
          inicial={{
            nome: modal.visitante.nome,
            telefone: modal.visitante.telefone,
            dataVisita: modal.visitante.dataVisita,
            quemConvidou: modal.visitante.quemConvidou,
            status: modal.visitante.status,
          }}
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleEditar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'excluir' && (
        <ModalConfirmacao
          nomeVisitante={modal.visitante.nome}
          onConfirmar={handleEliminar}
          onCancelar={() => setModal({ tipo: 'nenhum' })}
          isLoading={isSaving}
        />
      )}

      <div className="flex flex-col gap-6 md:gap-8 max-w-[1400px] mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Visitantes</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gestão e recepção de novas pessoas na igreja.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <button
              onClick={() => setModal({ tipo: 'criar' })}
              className="w-full md:w-auto bg-blue-900 hover:bg-blue-700 text-white px-5 py-3.5 md:py-2.5 rounded-xl font-bold text-base md:text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Plus size={20} className="md:w-4 md:h-4" />
              Novo Visitante
            </button>
          </div>
        </header>

        {/* Barra de Ferramentas: Busca */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 md:w-4 md:h-4" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full pl-12 md:pl-10 pr-4 py-3.5 md:py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-base md:text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Tabela / Lista Mobile */}
        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <Spinner />
              <p className="text-sm font-medium">Carregando visitantes...</p>
            </div>
          </div>
        ) : visitantesFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4 border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Users size={28} className="text-gray-400" />
            </div>
            <div className="text-center px-4">
              <p className="text-gray-900 font-bold text-base">
                {busca ? 'Nenhum visitante encontrado.' : 'Nenhuma ficha de visitante cadastrada.'}
              </p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {busca ? 'Tente ajustar os termos da busca.' : 'Toque em "Novo Visitante" para registrar.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl md:rounded-lg shadow-sm overflow-hidden">
            {/* Visualização Mobile (Cards) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {visitantesPaginados.map((visitante) => (
                <div key={visitante.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-gray-900 line-clamp-1">{visitante.nome}</span>
                      {visitante.telefone && (
                        <span className="text-sm font-medium text-gray-500 mt-0.5">{formatarTelefone(visitante.telefone)}</span>
                      )}
                    </div>
                    {renderStatusBadge(visitante.status)}
                  </div>
                  
                  <div className="flex justify-between items-end mt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">Visita:</span> {formatarData(visitante.dataVisita)}
                      </span>
                      {visitante.quemConvidou && (
                        <span className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">Convite:</span> {visitante.quemConvidou}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal({ tipo: 'editar', visitante })}
                        className="p-2.5 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setModal({ tipo: 'excluir', visitante })}
                        className="p-2.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visualização Desktop (Tabela) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Telefone</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Visita</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Convite</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visitantesPaginados.map((visitante) => (
                    <tr key={visitante.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">{visitante.nome}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-600">{formatarTelefone(visitante.telefone) || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-600">{formatarData(visitante.dataVisita)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-600">{visitante.quemConvidou || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(visitante.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setModal({ tipo: 'editar', visitante })}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => setModal({ tipo: 'excluir', visitante })}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginação */}
            <div className="px-4 py-4 md:px-6 md:py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-500">
                Mostrando {visitantesFiltrados.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1} a {Math.min(paginaAtual * ITENS_POR_PAGINA, visitantesFiltrados.length)} de {visitantesFiltrados.length}
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="flex-1 sm:flex-none px-4 py-3 md:py-2 rounded-xl md:rounded-lg border border-gray-200 text-gray-700 text-sm md:text-xs font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas || totalPaginas === 0}
                  className="flex-1 sm:flex-none px-4 py-3 md:py-2 rounded-xl md:rounded-lg border border-gray-200 text-gray-700 text-sm md:text-xs font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
