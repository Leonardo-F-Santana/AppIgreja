import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, UserCheck, UserCog, MoreVertical, ShieldAlert,
  Plus, Pencil, Trash2, X, Smartphone, SmartphoneNfc, Download
} from 'lucide-react';
import {
  ouvirMembros,
  atualizarFuncaoMembro,
  adicionarMembroManual,
  editarMembroManual,
  deletarMembro,
  type Membro,
  type MembroPayload,
} from '../services/membrosService';
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
}

const FORM_VAZIO: FormMembro = {
  username: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  role: 'membro',
};

function ModalForm({ tituloModal, inicial, onClose, onSalvar, isLoading }: ModalFormProps) {
  const [form, setForm] = useState<FormMembro>(inicial ?? { ...FORM_VAZIO });

  const set = <K extends keyof FormMembro>(key: K, value: FormMembro[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const formValido = form.username.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    await onSalvar({
      username: form.username.trim(),
      email: form.email?.trim() || '',
      telefone: form.telefone?.trim() || '',
      dataNascimento: form.dataNascimento || '',
      role: form.role,
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
                onChange={(e) => set('telefone', e.target.value)}
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

// ─── Página Principal ─────────────────────────────────────────────────────────

type ModalState =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; membro: Membro }
  | { tipo: 'excluir'; membro: Membro };

export default function MembrosPage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroAcesso, setFiltroAcesso] = useState('todos');
  const [filtroCargo, setFiltroCargo] = useState('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;
  
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  
  const [modal, setModal] = useState<ModalState>({ tipo: 'nenhum' });
  const [isSaving, setIsSaving] = useState(false);
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = ouvirMembros((dados) => {
      setMembros(dados);
      setCarregando(false);
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
      
      return matchBusca && matchAcesso && matchCargo;
    });
  }, [membros, busca, filtroAcesso, filtroCargo]);

  const totalPaginas = Math.ceil(membrosFiltrados.length / ITENS_POR_PAGINA);
  const membrosPaginados = membrosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroAcesso, filtroCargo]);

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
          }}
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleEditar}
          isLoading={isSaving}
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
                  'Telefone': m.telefone || '',
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

        {/* Barra de Ferramentas: Busca e Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/3 flex-shrink-0">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex w-full md:w-auto gap-3">
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
                          <span className="text-sm text-gray-700">{membro.telefone}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
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
