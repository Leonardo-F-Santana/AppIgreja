import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.png';
import bgLogin from '../assets/bglogin.png';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#eef5fd]">
      <div
        className="max-w-4xl w-full h-[600px] bg-white rounded-[2rem] shadow-2xl flex overflow-hidden relative"
        style={{
          backgroundImage: `url(${bgLogin})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* ─── Coluna Esquerda (Texto e Logo) ─── */}
        <div className="w-[40%] flex flex-col items-center justify-center p-8 z-10 hidden md:flex">
          <p className="text-white text-xl font-medium text-center mb-10 leading-relaxed drop-shadow-md">
            Junte-se à nossa<br />comunidade
          </p>
          <img
            src={logo}
            alt="Ministério IDE"
            className="w-64 object-contain drop-shadow-lg"
          />
        </div>

        {/* ─── Espaçador para a onda ─── */}
        <div className="flex-1 hidden md:block" />

        {/* ─── Coluna Direita (Formulário) ─── */}
        <div className="w-full md:w-[50%] flex flex-col justify-center px-8 md:pr-12 md:pl-0 z-10 bg-transparent">
          <div className="max-w-[340px] w-full mx-auto md:ml-auto md:mr-4">
            <h1 className="text-2xl font-semibold text-gray-800 text-center mb-6">
              Criar Nova Conta
            </h1>

            <form onSubmit={handleCadastro} className="flex flex-col gap-4">
              
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-xs font-bold text-gray-600 mb-1.5 tracking-wide">
                  Nome Completo <span className="text-red-400">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Ex: João da Silva"
                  required
                  className="w-full bg-[#f4f7ff] border-none rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-600 mb-1.5 tracking-wide">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Seu melhor e-mail"
                  required
                  className="w-full bg-[#f4f7ff] border-none rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Telefone */}
              <div>
                <label htmlFor="telefone" className="block text-xs font-bold text-gray-600 mb-1.5 tracking-wide">
                  Telefone (Opcional)
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  placeholder="(99) 99999-9999"
                  className="w-full bg-[#f4f7ff] border-none rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-600 mb-1.5 tracking-wide">
                  Senha <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo de 6 caracteres"
                    required
                    minLength={6}
                    className="w-full bg-[#f4f7ff] border-none rounded-lg px-4 py-3 pr-12 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Mensagem de Erro / Sucesso */}
              {error && (
                <p className="text-red-500 text-sm text-center font-medium">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-green-600 text-sm text-center font-medium">
                  {success}
                </p>
              )}

              {/* Botão Cadastro */}
              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full mt-2 bg-[#1a66ff] text-white font-bold py-3.5 rounded-lg
                  transition-all duration-300
                  hover:bg-blue-700 hover:shadow-[0_8px_15px_rgba(26,102,255,0.4)] hover:-translate-y-0.5
                  active:translate-y-0
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>

              <div className="text-center mt-3">
                <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                  Já tem uma conta? <span className="font-bold underline underline-offset-2">Faça Login</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
