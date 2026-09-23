import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { Heart, CheckCircle, Send } from 'lucide-react';
import logo from '../assets/logo.png';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarTelefone(valor: string): string {
  if (!valor) return '';
  const num = valor.replace(/\D/g, '').substring(0, 11);

  if (num.length === 11) {
    return num.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (num.length >= 10) {
    return num.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  if (num.length > 2) {
    return num.replace(/(\d{2})(\d+)/, '($1) $2');
  }
  return num;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  nome: string;
  telefone: string;
  quemConvidou: string;
  pedidoOracao: string;
}

const FORM_INICIAL: FormData = {
  nome: '',
  telefone: '',
  quemConvidou: '',
  pedidoOracao: '',
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Tela de Sucesso ──────────────────────────────────────────────────────────

function TelaSucesso({ onNovoCadastro }: { onNovoCadastro: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%)',
      }}
    >
      <div className="w-full max-w-md text-center animate-fadeIn">
        {/* Ícone animado */}
        <div className="mx-auto w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 animate-scaleIn">
          <div className="w-16 h-16 bg-emerald-500/30 rounded-full flex items-center justify-center">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Cadastro Realizado!
        </h1>

        <p className="text-blue-200/80 text-lg font-medium leading-relaxed mb-3">
          Deus abençoe sua vida. 🙏
        </p>
        <p className="text-blue-300/60 text-sm font-medium mb-10">
          É uma alegria ter você conosco hoje.
          Que este seja o começo de uma linda caminhada de fé.
        </p>

        <button
          onClick={onNovoCadastro}
          className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all duration-300"
        >
          Novo Cadastro
        </button>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function VisitantePublicoPage() {
  const [form, setForm] = useState<FormData>({ ...FORM_INICIAL });
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;

    setEnviando(true);
    setErro('');

    try {
      // Garante autenticação anônima para passar pelas regras do Firestore
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const visitantesRef = collection(db, 'visitantes');
      await addDoc(visitantesRef, {
        nome: form.nome.trim(),
        telefone: form.telefone,
        dataVisita: new Date().toISOString().split('T')[0],
        quemConvidou: form.quemConvidou.trim(),
        pedidoOracao: form.pedidoOracao.trim(),
        status: 'Novo',
        criadoPor: 'Autoatendimento',
        createdAt: serverTimestamp(),
      });
      setSucesso(true);
    } catch {
      setErro('Não foi possível enviar o cadastro. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleNovoCadastro = () => {
    setForm({ ...FORM_INICIAL });
    setSucesso(false);
    setErro('');
  };

  // ─── Tela de Sucesso ───────────────────────────────────────────────────────
  if (sucesso) {
    return <TelaSucesso onNovoCadastro={handleNovoCadastro} />;
  }

  // ─── Formulário ────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%)',
      }}
    >
      {/* Header */}
      <header className="flex flex-col items-center pt-10 pb-6 px-6">
        <img
          src={logo}
          alt="Logo da Igreja"
          className="w-20 h-20 object-contain rounded-2xl shadow-lg shadow-black/30 mb-5"
        />
        <h1 className="text-2xl font-bold text-white text-center tracking-tight">
          Seja Bem-Vindo!
        </h1>
        <p className="text-blue-200/70 text-sm font-medium text-center mt-2 max-w-xs leading-relaxed">
          É uma alegria ter você aqui. Preencha seus dados para que possamos
          conhecer você melhor.
        </p>
      </header>

      {/* Formulário */}
      <main className="flex-1 px-5 pb-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md mx-auto bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl shadow-black/20"
        >
          {/* Nome */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider">
              Nome Completo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Seu nome completo"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white text-base font-medium placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
            />
          </div>

          {/* Telefone */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider">
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => set('telefone', formatarTelefone(e.target.value))}
              placeholder="(99) 99999-9999"
              className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white text-base font-medium placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
            />
          </div>

          {/* Quem Convidou */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider">
              Quem te convidou?
            </label>
            <input
              type="text"
              value={form.quemConvidou}
              onChange={(e) => set('quemConvidou', e.target.value)}
              placeholder="Nome de quem convidou"
              className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white text-base font-medium placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
            />
          </div>

          {/* Pedido de Oração */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider">
              Pedido de Oração
            </label>
            <textarea
              value={form.pedidoOracao}
              onChange={(e) => set('pedidoOracao', e.target.value)}
              placeholder="Escreva seu pedido de oração aqui..."
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white text-base font-medium placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Erro */}
          {erro && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm font-medium text-center">
              {erro}
            </div>
          )}

          {/* Botão de Enviar */}
          <button
            type="submit"
            disabled={enviando || !form.nome.trim()}
            className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/30 mt-2"
          >
            {enviando ? (
              <>
                <Spinner /> Enviando...
              </>
            ) : (
              <>
                <Send size={18} />
                Enviar Cadastro
              </>
            )}
          </button>

          <p className="text-center text-white/30 text-xs font-medium flex items-center justify-center gap-1.5">
            <Heart size={12} className="text-rose-400/60" />
            Seus dados são tratados com carinho e respeito.
          </p>
        </form>
      </main>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out both;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
