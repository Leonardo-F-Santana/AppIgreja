import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, BookOpen, Plus, X, GraduationCap,
  UserPlus, Trash2, Calendar, ClipboardList, Pencil, Search,
} from 'lucide-react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
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

// ─── Classes reutilizáveis ────────────────────────────────────────────────────
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider';
const required = <span className="text-red-400 ml-0.5">*</span>;

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Turma {
  id: string;
  nome: string;
  professor: string;
  diaHorario: string;
  status: 'ativa' | 'encerrada';
}

interface Aluno {
  id: string;
  nome: string;
  membroId?: string;
  dataMatricula?: string;
  criadoEm?: Timestamp | null;
}

interface ChamadaAluno {
  alunoId: string;
  nome: string;
  presente: boolean;
  nota: number | null;
}

interface Aula {
  id?: string;
  data: string;
  tema: string;
  chamada: ChamadaAluno[];
  criadoPor?: {
    uid: string;
    nome: string;
    cargo: string;
  };
  criadoEm?: Timestamp | null;
}

// ─── Formatação de data ───────────────────────────────────────────────────────
function formatarData(dataISO: string): string {
  if (!dataISO) return '—';
  const parts = dataISO.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataISO;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: MATRICULAR ALUNO
// ═══════════════════════════════════════════════════════════════════════════════

interface ModalMatricularProps {
  onClose: () => void;
  onSalvar: (dados: { membroId: string; nome: string }) => Promise<void>;
  isLoading: boolean;
  alunosMatriculados: Aluno[];
}

function ModalMatricularAluno({ onClose, onSalvar, isLoading, alunosMatriculados }: ModalMatricularProps) {
  const [membroId, setMembroId] = useState('');
  const [membrosDisponiveis, setMembrosDisponiveis] = useState<{ id: string; nome: string }[]>([]);
  const [carregandoMembros, setCarregandoMembros] = useState(true);

  useEffect(() => {
    const fetchMembros = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('username', 'asc'));
        const snapshot = await getDocs(q);
        const lista = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            nome: data.username || data.nome || 'Sem Nome'
          };
        });
        const filtrada = lista.filter(m => !alunosMatriculados.some(a => a.membroId === m.id));
        setMembrosDisponiveis(filtrada);
      } catch (error: any) {
        console.error('Erro ao buscar membros:', error);
        // Fallback caso falte o índice
        if (error.message && error.message.includes('index')) {
          const fallbackQ = query(collection(db, 'users'));
          const snap = await getDocs(fallbackQ);
          const lista = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              nome: data.username || data.nome || 'Sem Nome'
            };
          });
          lista.sort((a, b) => a.nome.localeCompare(b.nome));
          const filtrada = lista.filter(m => !alunosMatriculados.some(a => a.membroId === m.id));
          setMembrosDisponiveis(filtrada);
        }
      } finally {
        setCarregandoMembros(false);
      }
    };
    fetchMembros();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membroId) return;
    const selecionado = membrosDisponiveis.find(m => m.id === membroId);
    if (!selecionado) return;
    await onSalvar({ membroId: selecionado.id, nome: selecionado.nome });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <UserPlus size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">Matricular Aluno</h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Adicionar à turma</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Membro{required}</label>
            <select
              value={membroId}
              onChange={(e) => setMembroId(e.target.value)}
              required
              disabled={carregandoMembros}
              className={`${inputClass} disabled:opacity-50 appearance-none`}
            >
              <option value="" disabled>
                {carregandoMembros ? 'Carregando membros...' : 'Selecione um membro'}
              </option>
              {membrosDisponiveis.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || carregandoMembros || !membroId}
              className="flex-1 py-3 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner /> Salvando...</> : 'Matricular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: REGISTRAR NOVA AULA (Diário de Classe)
// ═══════════════════════════════════════════════════════════════════════════════

interface ModalNovaAulaProps {
  aulaEditada?: Aula | null;
  alunos: Aluno[];
  onClose: () => void;
  onSalvar: (aula: { id?: string; data: string; tema: string; chamada: ChamadaAluno[] }) => Promise<void>;
  isLoading: boolean;
}

function ModalNovaAula({ aulaEditada, alunos, onClose, onSalvar, isLoading }: ModalNovaAulaProps) {
  const isEditing = !!aulaEditada;

  const [data, setData] = useState(aulaEditada?.data || new Date().toISOString().split('T')[0]);
  const [tema, setTema] = useState(aulaEditada?.tema || '');
  const [chamada, setChamada] = useState<ChamadaAluno[]>(() => {
    if (isEditing && aulaEditada.chamada) {
      const chamadaMap = new Map(aulaEditada.chamada.map(c => [c.alunoId, c]));
      return alunos.map(a => {
        const existente = chamadaMap.get(a.id);
        if (existente) {
          return { ...existente, nome: a.nome };
        }
        return {
          alunoId: a.id,
          nome: a.nome,
          presente: true,
          nota: null,
        };
      });
    } else {
      return alunos.map((a) => ({
        alunoId: a.id,
        nome: a.nome,
        presente: true,
        nota: null,
      }));
    }
  });

  const togglePresenca = (alunoId: string) => {
    setChamada((prev) =>
      prev.map((c) => (c.alunoId === alunoId ? { ...c, presente: !c.presente } : c)),
    );
  };

  const setNota = (alunoId: string, valor: string) => {
    const nota = valor === '' ? null : Number(valor);
    setChamada((prev) =>
      prev.map((c) => (c.alunoId === alunoId ? { ...c, nota } : c)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !tema.trim()) return;
    await onSalvar({ id: aulaEditada?.id, data, tema: tema.trim(), chamada });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <ClipboardList size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">
                {isEditing ? 'Editar Aula' : 'Registrar Nova Aula'}
              </h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">Diário de Classe</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="px-8 py-6 flex flex-col gap-5 overflow-y-auto">
            {/* Campos de Data e Tema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Data da Aula{required}</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Tema / Assunto{required}</label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ex: Parábola do Semeador"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Lista de Chamada */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Chamada dos Alunos</label>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {chamada.filter((c) => c.presente).length}/{chamada.length} presentes
                </span>
              </div>

              {chamada.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100">
                  <Users size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-medium">Nenhum aluno matriculado nesta turma.</p>
                  <p className="text-gray-400 text-xs mt-1">Matricule alunos na aba "Alunos" antes de registrar aulas.</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Header da lista */}
                  <div className="bg-gray-50 px-4 py-3 grid grid-cols-[1fr_80px_80px] gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>Aluno</span>
                    <span className="text-center">Presença</span>
                    <span className="text-center">Nota</span>
                  </div>
                  {/* Linhas dos alunos */}
                  <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
                    {chamada.map((c) => (
                      <div key={c.alunoId} className="px-4 py-3 grid grid-cols-[1fr_80px_80px] gap-3 items-center hover:bg-gray-50/50 transition-colors">
                        <span className="text-sm font-medium text-gray-800 truncate">{c.nome}</span>

                        {/* Toggle de Presença */}
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => togglePresenca(c.alunoId)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                              ${c.presente ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200
                                ${c.presente ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                        </div>

                        {/* Input de Nota */}
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={c.nota ?? ''}
                            onChange={(e) => setNota(c.alunoId, e.target.value)}
                            placeholder="—"
                            className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-xs font-medium text-center placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer / Botões */}
          <div className="px-8 py-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !data || !tema.trim()}
              className="flex-1 py-3 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner /> Salvando...</> : (isEditing ? 'Salvar Alterações' : 'Registrar Aula')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL: DETALHES DA TURMA
// ═══════════════════════════════════════════════════════════════════════════════

type AbaAtiva = 'alunos' | 'diario';

export default function TurmaDetalhesPage() {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Estado da Turma ─────────────────────────────────────────────────────────
  const [turma, setTurma] = useState<Turma | null>(null);
  const [carregandoTurma, setCarregandoTurma] = useState(true);

  // ── Estado da Aba ───────────────────────────────────────────────────────────
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('alunos');

  // ── Estado: Alunos Matriculados ─────────────────────────────────────────────
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);
  const [modalAluno, setModalAluno] = useState(false);
  const [isSavingAluno, setIsSavingAluno] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');

  // ── Estado: Diário de Classe (Aulas) ────────────────────────────────────────
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [carregandoAulas, setCarregandoAulas] = useState(true);
  const [modalAula, setModalAula] = useState(false);
  const [aulaParaEditar, setAulaParaEditar] = useState<Aula | null>(null);
  const [isSavingAula, setIsSavingAula] = useState(false);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // ── Listener: Dados da turma ────────────────────────────────────────────────
  useEffect(() => {
    if (!turmaId) return;
    const unsubscribe = onSnapshot(
      doc(db, 'turmas', turmaId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setTurma({
            id: snap.id,
            nome: data.nome || '',
            professor: data.professor || '',
            diaHorario: data.diaHorario || '',
            status: data.status || 'ativa',
          });
        } else {
          setTurma(null);
        }
        setCarregandoTurma(false);
      },
    );
    return () => unsubscribe();
  }, [turmaId]);

  // ── Listener: Alunos matriculados (subcoleção turmas/{turmaId}/alunos) ─────
  useEffect(() => {
    if (!turmaId) return;
    const alunosRef = collection(db, 'turmas', turmaId, 'alunos');
    const q = query(alunosRef, orderBy('criadoEm', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            nome: data.nome || '',
            membroId: data.membroId,
            criadoEm: data.criadoEm || null,
          } as Aluno;
        });
        setAlunos(lista);
        setCarregandoAlunos(false);
      },
      (error) => {
        console.error('[TurmaDetalhes] Erro ao escutar alunos:', error.message);
        if (error.message.includes('index')) {
          const fallbackQ = query(alunosRef);
          onSnapshot(fallbackQ, (snap) => {
            const lista = snap.docs.map((d) => {
              const data = d.data();
              return { id: d.id, nome: data.nome || '', membroId: data.membroId, criadoEm: data.criadoEm || null } as Aluno;
            });
            setAlunos(lista);
            setCarregandoAlunos(false);
          });
        } else {
          setAlunos([]);
          setCarregandoAlunos(false);
        }
      },
    );
    return () => unsubscribe();
  }, [turmaId]);

  // ── Listener: Aulas (subcoleção turmas/{turmaId}/aulas) ─────────────────────
  useEffect(() => {
    if (!turmaId) return;
    const aulasRef = collection(db, 'turmas', turmaId, 'aulas');
    const q = query(aulasRef, orderBy('criadoEm', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            data: data.data || '',
            tema: data.tema || '',
            chamada: data.chamada || [],
            criadoPor: data.criadoPor || undefined,
            criadoEm: data.criadoEm || null,
          } as Aula;
        });
        setAulas(lista);
        setCarregandoAulas(false);
      },
      (error) => {
        console.error('[TurmaDetalhes] Erro ao escutar aulas:', error.message);
        if (error.message.includes('index')) {
          const fallbackQ = query(aulasRef);
          onSnapshot(fallbackQ, (snap) => {
            const lista = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                data: data.data || '',
                tema: data.tema || '',
                chamada: data.chamada || [],
                criadoPor: data.criadoPor || undefined,
                criadoEm: data.criadoEm || null,
              } as Aula;
            });
            setAulas(lista);
            setCarregandoAulas(false);
          });
        } else {
          setAulas([]);
          setCarregandoAulas(false);
        }
      },
    );
    return () => unsubscribe();
  }, [turmaId]);

  // ── Handler: Matricular aluno ───────────────────────────────────────────────
  const handleMatricularAluno = async (dados: { membroId: string; nome: string }) => {
    if (!turmaId) return;

    if (alunos.some(a => a.membroId === dados.membroId)) {
      setToast({ mensagem: 'Este aluno já está matriculado nesta turma!', tipo: 'erro' });
      return;
    }

    setIsSavingAluno(true);
    try {
      const alunosRef = collection(db, 'turmas', turmaId, 'alunos');
      await addDoc(alunosRef, {
        membroId: dados.membroId,
        nome: dados.nome,
        dataMatricula: new Date().toISOString(),
        criadoEm: serverTimestamp(),
      });
      setModalAluno(false);
      setToast({ mensagem: 'Aluno matriculado com sucesso!', tipo: 'sucesso' });
    } catch (error) {
      console.error('Erro ao matricular aluno:', error);
      setToast({ mensagem: 'Erro ao matricular aluno.', tipo: 'erro' });
    } finally {
      setIsSavingAluno(false);
    }
  };

  // ── Handler: Remover aluno ──────────────────────────────────────────────────
  const handleRemoverAluno = async (alunoId: string) => {
    if (!turmaId) return;
    try {
      await deleteDoc(doc(db, 'turmas', turmaId, 'alunos', alunoId));
      setToast({ mensagem: 'Aluno removido da turma.', tipo: 'sucesso' });
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      setToast({ mensagem: 'Erro ao remover aluno.', tipo: 'erro' });
    }
  };

  // ── Handler: Registrar ou Editar aula ─────────────────────────────────────────────────
  const handleRegistrarOuEditarAula = async (payload: { id?: string; data: string; tema: string; chamada: ChamadaAluno[] }) => {
    if (!turmaId) return;
    setIsSavingAula(true);
    try {
      if (payload.id) {
        const aulaRef = doc(db, 'turmas', turmaId, 'aulas', payload.id);
        await updateDoc(aulaRef, {
          data: payload.data,
          tema: payload.tema,
          chamada: payload.chamada,
          ...(user && {
            atualizadoPor: { uid: user.uid, nome: user.nome || user.email || '', cargo: user.role }
          })
        });
        setToast({ mensagem: 'Aula atualizada com sucesso!', tipo: 'sucesso' });
      } else {
        const aulasRef = collection(db, 'turmas', turmaId, 'aulas');
        await addDoc(aulasRef, {
          data: payload.data,
          tema: payload.tema,
          chamada: payload.chamada,
          ...(user && {
            criadoPor: { uid: user.uid, nome: user.nome || user.email || '', cargo: user.role }
          }),
          criadoEm: serverTimestamp(),
        });
        setToast({ mensagem: 'Aula registrada com sucesso!', tipo: 'sucesso' });
      }
      setModalAula(false);
      setAulaParaEditar(null);
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      setToast({ mensagem: 'Erro ao salvar aula.', tipo: 'erro' });
    } finally {
      setIsSavingAula(false);
    }
  };

  const openEditModal = (aula: Aula) => {
    setAulaParaEditar(aula);
    setModalAula(true);
  };

  // ── Loading / Not Found ─────────────────────────────────────────────────────
  if (carregandoTurma) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <Spinner />
          <p className="text-sm font-medium">Carregando turma...</p>
        </div>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <GraduationCap size={40} className="text-gray-300" />
        <p className="text-gray-500 font-bold">Turma não encontrada.</p>
        <button
          onClick={() => navigate('/escolas')}
          className="text-blue-600 text-sm font-bold hover:underline"
        >
          ← Voltar para Escolas
        </button>
      </div>
    );
  }

  // ── Helper: Desempenho do Aluno ─────────────────────────────────────────────
  const calcularDesempenho = (alunoId: string) => {
    let faltas = 0;
    let somaNotas = 0;
    let qtdNotas = 0;

    aulas.forEach((aula) => {
      const registro = aula.chamada?.find((c) => c.alunoId === alunoId);
      if (registro) {
        if (!registro.presente) faltas++;
        if (registro.nota !== null && registro.nota !== undefined) {
          somaNotas += Number(registro.nota);
          qtdNotas++;
        }
      }
    });

    const mediaNotas = qtdNotas > 0 ? (somaNotas / qtdNotas).toFixed(1) : 'N/A';
    return { faltas, mediaNotas };
  };

  const alunosFiltrados = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {/* Modal de Matricular Aluno */}
      {modalAluno && (
        <ModalMatricularAluno
          onClose={() => setModalAluno(false)}
          onSalvar={handleMatricularAluno}
          isLoading={isSavingAluno}
          alunosMatriculados={alunos}
        />
      )}

      {/* Modal de Nova Aula */}
      {modalAula && (
        <ModalNovaAula
          aulaEditada={aulaParaEditar}
          alunos={alunos}
          onClose={() => { setModalAula(false); setAulaParaEditar(null); }}
          onSalvar={handleRegistrarOuEditarAula}
          isLoading={isSavingAula}
        />
      )}

      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-10">

        {/* Header */}
        <header className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/escolas')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Voltar para Escolas
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{turma.nome}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 font-medium">
                <span>Prof. {turma.professor}</span>
                <span className="text-gray-300">•</span>
                <span>{turma.diaHorario}</span>
                <span className="text-gray-300">•</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${turma.status === 'ativa' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {turma.status}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            <button
              onClick={() => setAbaAtiva('alunos')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors
                ${abaAtiva === 'alunos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}
            >
              <Users size={16} />
              Alunos Matriculados
              <span className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${abaAtiva === 'alunos' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {alunos.length}
              </span>
            </button>
            <button
              onClick={() => setAbaAtiva('diario')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors
                ${abaAtiva === 'diario'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}
            >
              <BookOpen size={16} />
              Diário de Classe
              <span className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${abaAtiva === 'diario' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {aulas.length}
              </span>
            </button>
          </nav>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ABA: ALUNOS MATRICULADOS                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {abaAtiva === 'alunos' && (
          <div className="flex flex-col gap-4">
            {/* Ação e Busca */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar aluno..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                />
              </div>
              <button
                onClick={() => setModalAluno(true)}
                className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <UserPlus size={16} />
                Matricular Aluno
              </button>
            </div>

            {/* Lista */}
            {carregandoAlunos ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4 text-gray-400">
                  <Spinner />
                  <p className="text-sm font-medium">Carregando alunos...</p>
                </div>
              </div>
            ) : alunos.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-16 gap-4 border border-gray-100">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users size={24} className="text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-gray-900 font-bold text-sm">Nenhum aluno matriculado.</p>
                  <p className="text-gray-400 text-xs font-medium mt-1">Clique em "Matricular Aluno" para adicionar.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Desempenho</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {alunosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">
                          Nenhum aluno encontrado para "{termoBusca}".
                        </td>
                      </tr>
                    ) : (
                      alunosFiltrados.map((aluno) => {
                        const desempenho = calcularDesempenho(aluno.id);
                        return (
                          <tr key={aluno.id} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{aluno.nome}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2 justify-end items-center">
                                <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">Faltas: {desempenho.faltas}</span>
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold min-w-[70px] text-center">Média: {desempenho.mediaNotas}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleRemoverAluno(aluno.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover aluno"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ABA: DIÁRIO DE CLASSE                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {abaAtiva === 'diario' && (
          <div className="flex flex-col gap-4">
            {/* Ação */}
            <div className="flex justify-end">
              <button
                onClick={() => { setAulaParaEditar(null); setModalAula(true); }}
                className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={16} />
                Registrar Nova Aula
              </button>
            </div>

            {/* Listagem de Aulas */}
            {carregandoAulas ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4 text-gray-400">
                  <Spinner />
                  <p className="text-sm font-medium">Carregando aulas...</p>
                </div>
              </div>
            ) : aulas.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-16 gap-4 border border-gray-100">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <BookOpen size={24} className="text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-gray-900 font-bold text-sm">Nenhuma aula registrada.</p>
                  <p className="text-gray-400 text-xs font-medium mt-1">Clique em "Registrar Nova Aula" para começar o diário de classe.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tema</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Presentes</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Total</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {aulas.map((aula) => {
                      const presentes = (aula.chamada || []).filter((c) => c.presente).length;
                      const total = (aula.chamada || []).length;
                      return (
                        <tr key={aula.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{formatarData(aula.data)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-700">{aula.tema}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                              ${presentes === total && total > 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'}`}
                            >
                              {presentes}/{total}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-500 font-medium">{total} alunos</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => openEditModal(aula)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar aula"
                            >
                              <Pencil size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
