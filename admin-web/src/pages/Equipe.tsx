import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, UserCheck, ShieldAlert, X, Search } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UsuarioFirestore {
  id: string;
  username?: string;
  email?: string;
  role?: string;
}

const ROLES_DISPONIVEIS = [
  { value: 'admin', label: 'Admin' },
  { value: 'tesouraria', label: 'Tesouraria' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'lider', label: 'Líder' },
  { value: 'membro', label: 'Membro' },
];

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
      {tipo === 'sucesso' ? <UserCheck size={16} /> : <ShieldAlert size={16} />}
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Badge de Cargo ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cores: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    tesouraria: 'bg-amber-100 text-amber-700',
    secretaria: 'bg-sky-100 text-sky-700',
    lider: 'bg-emerald-100 text-emerald-700',
    membro: 'bg-gray-100 text-gray-500',
  };

  const cor = cores[role] || cores.membro;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${cor}`}>
      {role}
    </span>
  );
}

// ─── Página Equipe ────────────────────────────────────────────────────────────

export default function Equipe() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioFirestore[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  // Escutar alterações na coleção users em tempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const lista: UsuarioFirestore[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsuarios(lista);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao escutar coleção users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtrar utilizadores por nome ou e-mail
  const usuariosFiltrados = usuarios.filter((u) => {
    if (!busca.trim()) return true;
    const termo = busca.toLowerCase();
    return (
      (u.username?.toLowerCase().includes(termo)) ||
      (u.email?.toLowerCase().includes(termo))
    );
  });

  // Atualizar cargo no Firestore
  async function handleAtualizarCargo(userId: string, novoCargo: string) {
    setAtualizando(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: novoCargo });
      setToast({ mensagem: 'Permissão atualizada com sucesso!', tipo: 'sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar cargo:', error);
      setToast({ mensagem: 'Erro ao atualizar permissão.', tipo: 'erro' });
    } finally {
      setAtualizando(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast de feedback */}
      {toast && (
        <Toast
          mensagem={toast.mensagem}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={26} className="text-emerald-600" />
            Gestão de Equipe
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os cargos e permissões dos utilizadores do sistema.
          </p>
        </div>

        {/* Contador */}
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <span className="font-semibold text-emerald-700">{usuarios.length}</span>
          <span>utilizador{usuarios.length !== 1 ? 'es' : ''} registado{usuarios.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Carregando utilizadores...</p>
            </div>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ShieldCheck size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {busca.trim() ? 'Nenhum utilizador encontrado.' : 'Nenhum utilizador registado.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cargo Atual</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Alterar Cargo</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const roleAtual = usuario.role || 'membro';
                  const isCurrentUser = usuario.id === currentUser?.uid;

                  return (
                    <tr
                      key={usuario.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Nome */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                            {(usuario.username || usuario.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {usuario.username || '—'}
                            </p>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Você</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {usuario.email || '—'}
                      </td>

                      {/* Cargo Atual */}
                      <td className="px-6 py-4">
                        <RoleBadge role={roleAtual} />
                      </td>

                      {/* Alterar Cargo */}
                      <td className="px-6 py-4">
                        {isCurrentUser ? (
                          <span className="text-xs text-gray-400 italic">Próprio utilizador</span>
                        ) : (
                          <div className="relative">
                            <select
                              value={roleAtual}
                              disabled={atualizando === usuario.id}
                              onChange={(e) => handleAtualizarCargo(usuario.id, e.target.value)}
                              className="appearance-none w-full max-w-[160px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 cursor-pointer hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {ROLES_DISPONIVEIS.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            {/* Seta do select */}
                            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
