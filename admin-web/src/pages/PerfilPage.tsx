import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, Phone, Mail, Shield, Save, CheckCircle, AlertTriangle, X } from 'lucide-react';

// ─── Utilidade de Máscara ─────────────────────────────────────────────────────
function formatarTelefone(valor: string) {
  const v = valor.replace(/\D/g, '');
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

// ─── Componente Toast ─────────────────────────────────────────────────────────
interface ToastProps {
  mensagem: string;
  tipo: 'sucesso' | 'erro';
  onClose: () => void;
}

function Toast({ mensagem, tipo, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white text-sm font-semibold
      ${tipo === 'sucesso' ? 'bg-blue-600' : 'bg-red-600'}`}
    >
      {tipo === 'sucesso' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

export default function PerfilPage() {
  const { user } = useAuth();
  
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNome(data.nome || '');
          setTelefone(data.telefone ? formatarTelefone(data.telefone) : '');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setToast({ mensagem: 'Erro ao carregar dados do perfil.', tipo: 'erro' });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, [user]);

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatarTelefone(e.target.value));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        nome: nome.trim(),
        telefone: telefone.replace(/\D/g, '') // Salva apenas os números
      });
      setToast({ mensagem: 'Perfil atualizado com sucesso!', tipo: 'sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setToast({ mensagem: 'Erro ao salvar alterações.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm font-medium">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}
      
      <div className="max-w-2xl mx-auto pb-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Meu Perfil</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Visualize e atualize os seus dados pessoais.
          </p>
        </header>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* Header do Card */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0">
              {nome ? nome.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Configurações da Conta</h2>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Mantenha os seus dados de contato atualizados.</p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSave} className="p-8 flex flex-col gap-6">
            
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Nome */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Seu nome completo"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telefone (WhatsApp)</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    required
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* E-mail (Disabled) */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                  <span>E-mail de Acesso</span>
                  <span className="text-[10px] text-gray-400 normal-case">(Apenas Leitura)</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-100 text-gray-500 text-sm font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Cargo (Disabled) */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                  <span>Nível de Acesso</span>
                  <span className="text-[10px] text-gray-400 normal-case">(Apenas Leitura)</span>
                </label>
                <div className="relative">
                  <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={user?.role ? user.role.toUpperCase() : 'Não definido'}
                    disabled
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-100 text-gray-500 text-sm font-bold tracking-wider cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
