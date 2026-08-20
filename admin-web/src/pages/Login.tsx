import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.png';
import bgLogin from '../assets/bglogin.png';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login efetuado com sucesso:', userCredential.user.email);
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Erro de autenticação:', err);
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#eef5fd]">
      <div
        className="max-w-4xl w-full h-[520px] bg-white rounded-[2rem] shadow-2xl flex overflow-hidden relative"
        style={{
          backgroundImage: `url(${bgLogin})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* ─── Coluna Esquerda (Texto e Logo) ─── */}
        <div className="w-[40%] flex flex-col items-center justify-center p-8 z-10">
          <p className="text-white text-xl font-medium text-center mb-10 leading-relaxed drop-shadow-md">
            Bem vindo ao painel<br />administrativo
          </p>
          <img
            src={logo}
            alt="Ministério IDE"
            className="w-64 object-contain drop-shadow-lg"
          />
        </div>

        {/* ─── Espaçador para a onda ─── */}
        <div className="flex-1" />

        {/* ─── Coluna Direita (Formulário) ─── */}
        <div className="w-[45%] flex flex-col justify-center pr-12 z-10 bg-transparent">
          <div className="max-w-[320px] w-full ml-auto mr-4">
            <h1 className="text-2xl font-semibold text-gray-800 text-center mb-10">
              Entre na sua conta
            </h1>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-600 mb-1.5 tracking-wide">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Insira seu Email"
                  required
                  className="w-full bg-[#f4f7ff] border-none rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-600 mb-1.5 tracking-wide">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Insira sua Senha"
                    required
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

              {/* Mensagem de Erro */}
              {error && (
                <p className="text-red-500 text-sm text-center font-medium -mt-1">
                  {error}
                </p>
              )}

              {/* Botão Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#1a66ff] text-white font-bold py-3.5 rounded-lg
                  transition-all duration-300
                  hover:bg-blue-700 hover:shadow-[0_8px_15px_rgba(26,102,255,0.4)] hover:-translate-y-0.5
                  active:translate-y-0
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? 'Entrando...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
