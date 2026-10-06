import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import logo from '../assets/logo-black.png';

export default function CadastroPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const nome = (form.elements.namedItem('nome') as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const telefone = (form.elements.namedItem('telefone') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (!nome) {
      setError('O nome completo é obrigatório.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Criação de perfil no Firestore forçando role 'membro' (sem privilégios administrativos)
      await setDoc(doc(db, 'users', uid), {
        nome,
        email,
        telefone: telefone || null,
        role: 'membro', 
        createdAt: serverTimestamp()
      });

      setSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/');
      }, 2500);
      
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else {
        setError('Ocorreu um erro ao criar a conta. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8">
        
        {/* Logo and Header */}
        <div className="mb-8">
          <img 
            src={logo}
            alt="Logo da Igreja" 
            className="w-32 h-auto mx-auto mb-6 object-contain" 
          />
          <h1 className="text-2xl font-bold text-gray-900 text-center">Crie sua Conta</h1>
        </div>

        <form onSubmit={handleCadastro} className="flex flex-col gap-5">
          {/* Nome */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <input
              id="nome"
              name="nome"
              type="text"
              placeholder="Nome Completo *"
              required
              className="w-full h-14 pl-12 pr-4 bg-blue-50/50 border border-blue-100 rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="E-mail *"
              required
              className="w-full h-14 pl-12 pr-4 bg-blue-50/50 border border-blue-100 rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Telefone */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-blue-400" />
            </div>
            <input
              id="telefone"
              name="telefone"
              type="tel"
              placeholder="Telefone (Opcional)"
              className="w-full h-14 pl-12 pr-4 bg-blue-50/50 border border-blue-100 rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-blue-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha (mínimo de 6 caracteres) *"
              required
              minLength={6}
              className="w-full h-14 pl-12 pr-12 bg-blue-50/50 border border-blue-100 rounded-xl text-base text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-400 hover:text-blue-600 transition-colors focus:outline-none"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Mensagens de Erro / Sucesso */}
          {error && <p className="text-red-500 text-sm text-center font-medium mt-1">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center font-medium mt-1">{success}</p>}

          {/* Botão Principal */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full h-14 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>

          {/* Link Login */}
          <div className="text-center mt-6">
            <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
              Já tem uma conta? <span className="text-blue-600 font-bold">Faça Login</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
