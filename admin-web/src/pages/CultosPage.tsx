import { useState, useEffect, useMemo } from 'react';
import {
  Church, Search, Plus, Pencil, Trash2, X, Users, BookOpen
} from 'lucide-react';
import {
  ouvirCultos,
  adicionarCulto,
  editarCulto,
  deletarCulto,
  type CultoRegistro,
} from '../services/cultosService';

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
  // Avoid timezone issues by using the string parts directly if it's YYYY-MM-DD
  const parts = dataISO.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataISO;
}

// ─── Classes reutilizáveis do form ────────────────────────────────────────────
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider';
const required = <span className="text-red-400 ml-0.5">*</span>;

// ─── Modal de Criação / Edição ────────────────────────────────────────────────
type FormCulto = Omit<CultoRegistro, 'id' | 'createdAt'>;

interface ModalFormProps {
  tituloModal: string;
  inicial?: FormCulto;
  onClose: () => void;
  onSalvar: (form: FormCulto) => Promise<void>;
  isLoading: boolean;
}

const FORM_VAZIO: FormCulto = {
  data: new Date().toISOString().split('T')[0],
  tipo: 'Culto da Família',
  adultos: 0,
  criancas: 0,
  visitantes: 0,
};

const TIPOS_CULTO = ['Culto da Família', 'Santa Ceia', 'Ensino', 'Jovens', 'Mulheres', 'Homens', 'Especial'];

function ModalForm({ tituloModal, inicial, onClose, onSalvar, isLoading }: ModalFormProps) {
  const [form, setForm] = useState<FormCulto>(inicial ?? { ...FORM_VAZIO });

  const set = <K extends keyof FormCulto>(key: K, value: FormCulto[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data || !form.tipo) return;
    await onSalvar({
      data: form.data,
      tipo: form.tipo,
      adultos: Number(form.adultos) || 0,
      criancas: Number(form.criancas) || 0,
      visitantes: Number(form.visitantes) || 0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <BookOpen size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">{tituloModal}</h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Gestão de Cultos</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Data{required}</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => set('data', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Tipo de Culto{required}</label>
              <select
                value={form.tipo}
                onChange={(e) => set('tipo', e.target.value)}
                required
                className={inputClass}
              >
                {TIPOS_CULTO.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Adultos</label>
              <input
                type="number"
                min="0"
                value={form.adultos}
                onChange={(e) => set('adultos', Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Crianças</label>
              <input
                type="number"
                min="0"
                value={form.criancas}
                onChange={(e) => set('criancas', Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Visitantes</label>
              <input
                type="number"
                min="0"
                value={form.visitantes}
                onChange={(e) => set('visitantes', Number(e.target.value))}
                className={inputClass}
              />
            </div>
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
              disabled={isLoading || !form.data || !form.tipo}
              className="flex-1 py-3 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner /> Salvando...</> : 'Salvar Culto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────
interface ModalConfirmacaoProps {
  infoCulto: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  isLoading: boolean;
}

function ModalConfirmacao({ infoCulto, onConfirmar, onCancelar, isLoading }: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg mb-1">Excluir Culto</h2>
            <p className="text-gray-500 text-sm font-medium">
              Tem certeza que deseja excluir o registro de{' '}
              <span className="font-bold text-gray-700">{infoCulto}</span>?
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

// ─── Página Principal ─────────────────────────────────────────────────────────

type ModalState =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; culto: CultoRegistro }
  | { tipo: 'excluir'; culto: CultoRegistro };

export default function CultosPage() {
  const [cultos, setCultos] = useState<CultoRegistro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;
  
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  
  const [modal, setModal] = useState<ModalState>({ tipo: 'nenhum' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = ouvirCultos((dados) => {
      setCultos(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  const cultosFiltrados = useMemo(() => {
    return cultos.filter((c) => {
      const termo = busca.toLowerCase();
      return c.tipo.toLowerCase().includes(termo) || formatarData(c.data).includes(termo);
    });
  }, [cultos, busca]);

  const totalPaginas = Math.ceil(cultosFiltrados.length / ITENS_POR_PAGINA);
  const cultosPaginados = cultosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca]);

  const handleCriar = async (form: FormCulto) => {
    setIsSaving(true);
    try {
      await adicionarCulto(form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Registro criado com sucesso!', tipo: 'sucesso' });
    } catch (error: any) {
      setToast({ mensagem: 'Erro ao criar registro.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditar = async (form: FormCulto) => {
    if (modal.tipo !== 'editar' || !modal.culto.id) return;
    setIsSaving(true);
    try {
      await editarCulto(modal.culto.id, form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Registro atualizado com sucesso!', tipo: 'sucesso' });
    } catch (error) {
      setToast({ mensagem: 'Erro ao atualizar registro.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (modal.tipo !== 'excluir' || !modal.culto.id) return;
    setIsSaving(true);
    try {
      await deletarCulto(modal.culto.id);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Registro excluído.', tipo: 'sucesso' });
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
          tituloModal="Novo Registro"
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleCriar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'editar' && (
        <ModalForm
          tituloModal="Editar Registro"
          inicial={{
            data: modal.culto.data,
            tipo: modal.culto.tipo,
            adultos: modal.culto.adultos,
            criancas: modal.culto.criancas,
            visitantes: modal.culto.visitantes,
          }}
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleEditar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'excluir' && (
        <ModalConfirmacao
          infoCulto={`${modal.culto.tipo} (${formatarData(modal.culto.data)})`}
          onConfirmar={handleEliminar}
          onCancelar={() => setModal({ tipo: 'nenhum' })}
          isLoading={isSaving}
        />
      )}

      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cultos</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Registre a frequência e o volume de pessoas nos eventos da igreja.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setModal({ tipo: 'criar' })}
              className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} />
              Novo Registro
            </button>
          </div>
        </header>

        {/* Barra de Ferramentas: Busca */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-1/2">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por tipo ou data..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Tabela */}
        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <Spinner />
              <p className="text-sm font-medium">Carregando registros de cultos...</p>
            </div>
          </div>
        ) : cultosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4 border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Church size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-bold text-base">
                {busca ? 'Nenhum registro encontrado.' : 'Nenhum culto registrado ainda.'}
              </p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {busca ? 'Tente ajustar os termos da sua pesquisa.' : 'Clique em "+ Novo Registro" para começar.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Adultos</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Crianças</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Visitantes</th>
                  <th className="px-6 py-4 text-xs font-medium text-blue-600 uppercase tracking-wider text-center bg-blue-50/50">Total</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cultosPaginados.map((culto) => {
                  const total = culto.adultos + culto.criancas + culto.visitantes;
                  return (
                    <tr key={culto.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{formatarData(culto.data)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {culto.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-700">{culto.adultos}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-700">{culto.criancas}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-700">{culto.visitantes}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center bg-blue-50/30">
                        <span className="text-sm font-bold text-blue-700">{total}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setModal({ tipo: 'editar', culto })}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => setModal({ tipo: 'excluir', culto })}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Paginação */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-lg">
              <span className="text-xs font-medium text-gray-500">
                Mostrando {cultosFiltrados.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1} a {Math.min(paginaAtual * ITENS_POR_PAGINA, cultosFiltrados.length)} de {cultosFiltrados.length} registros
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
