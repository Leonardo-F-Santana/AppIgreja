import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Plus, X, Settings, Users, BookOpen, Pencil, Trash2
} from 'lucide-react';
import {
  ouvirTurmas,
  adicionarTurma,
  editarTurma,
  deletarTurma,
  type Turma,
} from '../services/turmasService';
import { useAuth } from '../contexts/AuthContext';

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

// ─── Classes reutilizáveis do form ────────────────────────────────────────────
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider';
const required = <span className="text-red-400 ml-0.5">*</span>;

// ─── Tipo do formulário ───────────────────────────────────────────────────────
interface FormTurma {
  nome: string;
  professor: string;
  diaHorario: string;
}



// ─── Modal de Nova Turma ──────────────────────────────────────────────────────
interface ModalNovaTurmaProps {
  turmaEditada?: Turma | null;
  onClose: () => void;
  onSalvar: (form: FormTurma) => Promise<void>;
  isLoading: boolean;
}

function ModalNovaTurma({ turmaEditada, onClose, onSalvar, isLoading }: ModalNovaTurmaProps) {
  const isEditing = !!turmaEditada;
  const [form, setForm] = useState<FormTurma>({
    nome: turmaEditada?.nome || '',
    professor: turmaEditada?.professor || '',
    diaHorario: turmaEditada?.diaHorario || '',
  });

  const set = <K extends keyof FormTurma>(key: K, value: FormTurma[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.professor.trim() || !form.diaHorario.trim()) return;
    await onSalvar({
      nome: form.nome.trim(),
      professor: form.professor.trim(),
      diaHorario: form.diaHorario.trim(),
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
              <GraduationCap size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">{isEditing ? 'Editar Turma' : 'Nova Turma'}</h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Gestão de Escolas e Turmas</p>
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
            <label className={labelClass}>Nome da Turma{required}</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex: EBD Adultos"
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Professor{required}</label>
            <input
              type="text"
              value={form.professor}
              onChange={(e) => set('professor', e.target.value)}
              placeholder="Nome do professor responsável"
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Dia / Horário{required}</label>
            <input
              type="text"
              value={form.diaHorario}
              onChange={(e) => set('diaHorario', e.target.value)}
              placeholder="Ex: Domingo, 09:00 às 10:00"
              required
              className={inputClass}
            />
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
              disabled={isLoading || !form.nome.trim() || !form.professor.trim() || !form.diaHorario.trim()}
              className="flex-1 py-3 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner /> Salvando...</> : isEditing ? 'Salvar Alterações' : 'Criar Turma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function EscolasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [turmaParaEditar, setTurmaParaEditar] = useState<Turma | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  useEffect(() => {
    const unsubscribe = ouvirTurmas((dados) => {
      setTurmas(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtra apenas turmas ativas para a listagem principal
  const turmasAtivas = turmas.filter((t) => t.status === 'ativa');

  const handleSalvarTurma = async (form: FormTurma) => {
    setIsSaving(true);
    try {
      if (turmaParaEditar && turmaParaEditar.id) {
        await editarTurma(turmaParaEditar.id, {
          nome: form.nome,
          professor: form.professor,
          diaHorario: form.diaHorario,
        });
        setToast({ mensagem: 'Turma atualizada com sucesso!', tipo: 'sucesso' });
      } else {
        await adicionarTurma({
          nome: form.nome,
          professor: form.professor,
          diaHorario: form.diaHorario,
          status: 'ativa',
          ...(user && {
            criadoPor: { uid: user.uid, nome: user.nome || user.email || '', cargo: user.role }
          }),
        });
        setToast({ mensagem: 'Turma criada com sucesso!', tipo: 'sucesso' });
      }
      setModalAberto(false);
      setTurmaParaEditar(null);
    } catch (error: any) {
      console.error('Erro ao salvar turma:', error);
      setToast({ mensagem: 'Erro ao salvar turma.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcluirTurma = async (turmaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta turma? Esta ação não poderá ser desfeita.')) {
      return;
    }
    
    setTurmas(prev => prev.filter(t => t.id !== turmaId));
    try {
      await deletarTurma(turmaId);
      setToast({ mensagem: 'Turma excluída com sucesso!', tipo: 'sucesso' });
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
      setToast({ mensagem: 'Erro ao excluir turma.', tipo: 'erro' });
    }
  };

  return (
    <>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {modalAberto && (
        <ModalNovaTurma
          turmaEditada={turmaParaEditar}
          onClose={() => { setModalAberto(false); setTurmaParaEditar(null); }}
          onSalvar={handleSalvarTurma}
          isLoading={isSaving}
        />
      )}

      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Escolas e Turmas</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gerencie as turmas das escolas da igreja. Futuramente, controle chamadas e notas dos alunos.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setTurmaParaEditar(null); setModalAberto(true); }}
              className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} />
              Nova Turma
            </button>
          </div>
        </header>

        {/* Listagem */}
        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <Spinner />
              <p className="text-sm font-medium">Carregando turmas...</p>
            </div>
          </div>
        ) : turmasAtivas.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4 border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <GraduationCap size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-bold text-base">
                Nenhuma turma ativa encontrada.
              </p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                Clique em "+ Nova Turma" para começar a cadastrar.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {turmasAtivas.map((turma) => (
              <div
                key={turma.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-blue-100 p-2.5 rounded-xl flex-shrink-0">
                      <BookOpen size={18} className="text-blue-700" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-gray-900 font-bold text-sm leading-tight truncate">
                        {turma.nome}
                      </h3>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wider">
                        Ativa
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium truncate">Prof. {turma.professor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Settings size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium truncate">{turma.diaHorario}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => navigate(`/escolas/${turma.id}`)}
                    className="flex-1 py-2.5 rounded-xl border border-blue-200 text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings size={14} />
                    Gerenciar Turma
                  </button>
                  <button
                    onClick={() => { setTurmaParaEditar(turma); setModalAberto(true); }}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center justify-center"
                    title="Editar Turma"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleExcluirTurma(turma.id!)}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"
                    title="Excluir Turma"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
