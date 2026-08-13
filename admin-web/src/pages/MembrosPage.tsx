import { useState, useEffect, useRef } from 'react';
import {
  Users, Search, UserCheck, UserCog, MoreVertical, ShieldAlert
} from 'lucide-react';
import {
  ouvirMembros,
  atualizarFuncaoMembro,
  type Membro,
} from '../services/membrosService';

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
        &times;
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(ts: Membro['createdAt']): string {
  if (!ts) return '—';
  // Verifica se é Timestamp do Firestore ou Data
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts as any);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function MembrosPage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  
  // Controle de menus abertos por ID de membro
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = ouvirMembros((dados) => {
      setMembros(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  const membrosFiltrados = membros.filter((m) =>
    m.username.toLowerCase().includes(busca.toLowerCase()) ||
    m.email.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAlterarRole = async (id: string, novaRole: string) => {
    try {
      setMenuAbertoId(null);
      await atualizarFuncaoMembro(id, novaRole);
      setToast({ mensagem: `Função atualizada para ${novaRole === 'admin' ? 'Administrador' : 'Membro'}.`, tipo: 'sucesso' });
    } catch (error) {
      setToast({ mensagem: 'Erro ao atualizar nível de acesso.', tipo: 'erro' });
    }
  };

  const toggleMenu = (id: string) => {
    setMenuAbertoId(prev => prev === id ? null : id);
  };

  return (
    <>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Membros</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gerencie os utilizadores registrados na aplicação móvel.
            </p>
          </div>
        </header>

        {/* Busca */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Tabela */}
        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium">Carregando lista de membros...</p>
            </div>
          </div>
        ) : membrosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Users size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-bold text-base">
                {busca ? 'Nenhum membro encontrado.' : 'Nenhum membro registrado ainda.'}
              </p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {busca && 'Tente ajustar os termos da sua pesquisa.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Membro</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data de Registo</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nível de Acesso</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {membrosFiltrados.map((membro) => {
                    const isAdmin = membro.role === 'admin';
                    const isMenuOpen = menuAbertoId === membro.id;
                    return (
                      <tr key={membro.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                              {membro.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-900 font-semibold text-sm">
                              {membro.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-500 text-sm font-medium">{membro.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-500 text-sm font-medium">{formatarData(membro.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold 
                            ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}
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
                                onClick={() => setMenuAbertoId(null)}
                              ></div>
                              <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                {isAdmin ? (
                                  <button
                                    onClick={() => handleAlterarRole(membro.id, 'membro')}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors flex items-center gap-2"
                                  >
                                    <UserCheck size={16} />
                                    Tornar Membro
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAlterarRole(membro.id, 'admin')}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                                  >
                                    <UserCog size={16} />
                                    Tornar Administrador
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Contagem no rodapé da tabela */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500">
              Mostrando {membrosFiltrados.length} utilizador{membrosFiltrados.length !== 1 ? 'es' : ''}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
