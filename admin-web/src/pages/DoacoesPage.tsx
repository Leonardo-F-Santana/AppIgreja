import { useState, useEffect } from 'react';
import {
  Heart, Plus, Trash2, Pencil, X, Search,
  QrCode, Landmark, Copy
} from 'lucide-react';
import {
  ouvirDoacoes,
  criarDoacao,
  editarDoacao,
  deletarDoacao,
  alternarStatus,
  type Doacao,
  type NovaDoacao,
} from '../services/doacoesService';

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
      {tipo === 'sucesso' ? <Heart size={16} /> : <X size={16} />}
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50
        ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

// ─── Modal de Criação / Edição ────────────────────────────────────────────────

interface ModalFormProps {
  inicial?: Doacao;
  titulo: string;
  onClose: () => void;
  onSalvar: (form: NovaDoacao) => Promise<void>;
  isLoading: boolean;
}

function ModalForm({ inicial, titulo, onClose, onSalvar, isLoading }: ModalFormProps) {
  const [form, setForm] = useState<NovaDoacao>(
    inicial ?? { titulo: '', descricao: '', tipo: 'PIX', chaveOuConta: '', ativo: true }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.chaveOuConta.trim()) return;
    await onSalvar(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto py-10"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl">
              <Heart size={18} className="text-emerald-700" />
            </div>
            <h2 className="text-gray-900 font-bold text-lg">{titulo}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título da Campanha</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: Dízimos, Missões..."
              required
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição (Breve)</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Descreva o propósito da arrecadação..."
              maxLength={200}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Conta</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, tipo: 'PIX' }))}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${form.tipo === 'PIX'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <QrCode size={16} />
                Chave PIX
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, tipo: 'Transferência Bancária' }))}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${form.tipo === 'Transferência Bancária'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <Landmark size={16} />
                Transferência
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {form.tipo === 'PIX' ? 'Chave PIX' : 'Dados Bancários (IBAN/Conta)'}
            </label>
            <input
              type="text"
              value={form.chaveOuConta}
              onChange={(e) => setForm(f => ({ ...f, chaveOuConta: e.target.value }))}
              placeholder={form.tipo === 'PIX' ? 'ex: celular, email, CPF...' : 'ex: Banco, Agência, Conta...'}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-2">
            <div>
              <p className="text-sm font-bold text-gray-900">Visível no Aplicativo</p>
              <p className="text-xs font-medium text-gray-500">Membros poderão ver esta conta.</p>
            </div>
            <ToggleSwitch 
              checked={form.ativo} 
              onChange={(ativo) => setForm(f => ({ ...f, ativo }))} 
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !form.titulo.trim() || !form.chaveOuConta.trim()}
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
  tituloItem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  isLoading: boolean;
}

function ModalConfirmacao({ tituloItem, onConfirmar, onCancelar, isLoading }: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg mb-1">Excluir Conta</h2>
            <p className="text-gray-500 text-sm font-medium">
              Tem certeza que deseja excluir a conta <span className="font-bold text-gray-700">"{tituloItem}"</span>? Esta ação não pode ser desfeita.
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

// ─── Página Principal ─────────────────────────────────────────────────────────

type ModalState =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; doacao: Doacao }
  | { tipo: 'excluir'; doacao: Doacao };

export default function DoacoesPage() {
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState<ModalState>({ tipo: 'nenhum' });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  useEffect(() => {
    const unsubscribe = ouvirDoacoes((dados) => {
      setDoacoes(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  const doacoesFiltradas = doacoes.filter((d) =>
    d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    d.chaveOuConta.toLowerCase().includes(busca.toLowerCase())
  );

  const handleCriar = async (form: NovaDoacao) => {
    setIsSaving(true);
    try {
      await criarDoacao(form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Conta/Campanha criada com sucesso!', tipo: 'sucesso' });
    } catch {
      setToast({ mensagem: 'Erro ao criar conta. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditar = async (form: NovaDoacao) => {
    if (modal.tipo !== 'editar') return;
    setIsSaving(true);
    try {
      await editarDoacao(modal.doacao.id, form);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Conta/Campanha atualizada com sucesso!', tipo: 'sucesso' });
    } catch {
      setToast({ mensagem: 'Erro ao atualizar conta. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcluir = async () => {
    if (modal.tipo !== 'excluir') return;
    setIsSaving(true);
    try {
      await deletarDoacao(modal.doacao.id);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Conta/Campanha excluída.', tipo: 'sucesso' });
    } catch {
      setToast({ mensagem: 'Erro ao excluir conta. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAtivo = async (doacao: Doacao, novoStatus: boolean) => {
    try {
      await alternarStatus(doacao.id, novoStatus);
      // Feedback visual não é estritamente necessário no toast porque o toggle já muda na hora devido ao onSnapshot
    } catch {
      setToast({ mensagem: 'Erro ao alterar status da conta.', tipo: 'erro' });
    }
  };

  const copiarChave = (chave: string) => {
    navigator.clipboard.writeText(chave);
    setToast({ mensagem: 'Chave copiada para a área de transferência!', tipo: 'sucesso' });
  };

  return (
    <>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {modal.tipo === 'criar' && (
        <ModalForm
          titulo="Nova Conta / Campanha"
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleCriar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'editar' && (
        <ModalForm
          titulo="Editar Conta / Campanha"
          inicial={modal.doacao}
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleEditar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'excluir' && (
        <ModalConfirmacao
          tituloItem={modal.doacao.titulo}
          onConfirmar={handleExcluir}
          onCancelar={() => setModal({ tipo: 'nenhum' })}
          isLoading={isSaving}
        />
      )}

      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dízimos e Ofertas</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gerencie as contas e campanhas de arrecadação da igreja.
            </p>
          </div>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="bg-emerald-900 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Nova Conta/Campanha
          </button>
        </header>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou chave..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium">Carregando dados...</p>
            </div>
          </div>
        ) : doacoesFiltradas.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Heart size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-bold text-base">
                {busca ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada'}
              </p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {busca ? 'Tente ajustar os filtros de busca.' : 'Clique em "+ Nova Conta/Campanha" para adicionar a primeira.'}
              </p>
            </div>
            {!busca && (
              <button
                onClick={() => setModal({ tipo: 'criar' })}
                className="mt-2 bg-emerald-900 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Nova Conta/Campanha
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doacoesFiltradas.map((doacao) => (
              <div
                key={doacao.id}
                className={`bg-white rounded-2xl shadow-sm border-t-4 transition-shadow hover:shadow-md flex flex-col
                  ${doacao.ativo ? 'border-t-emerald-500' : 'border-t-gray-300 opacity-80 grayscale-[20%]'}`}
              >
                {/* Header Card */}
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                        ${doacao.tipo === 'PIX' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        {doacao.tipo === 'PIX' ? <QrCode size={20} /> : <Landmark size={20} />}
                      </div>
                      <div>
                        <h3 className="text-gray-900 font-bold text-base leading-tight">{doacao.titulo}</h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                          ${doacao.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {doacao.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {doacao.descricao && (
                    <p className="text-gray-500 text-sm font-medium leading-relaxed mb-4 line-clamp-2">
                      {doacao.descricao}
                    </p>
                  )}

                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {doacao.tipo === 'PIX' ? 'Chave PIX' : 'Dados Bancários'}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-gray-900 font-semibold text-sm truncate flex-1">{doacao.chaveOuConta}</p>
                      <button 
                        onClick={() => copiarChave(doacao.chaveOuConta)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                        title="Copiar chave"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 rounded-b-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ToggleSwitch 
                      checked={doacao.ativo} 
                      onChange={(ativo) => handleToggleAtivo(doacao, ativo)} 
                    />
                    <span className="text-xs font-semibold text-gray-500">
                      Visível
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModal({ tipo: 'editar', doacao })}
                      className="p-2 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setModal({ tipo: 'excluir', doacao })}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
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
