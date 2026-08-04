import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <h2>Ministério IDE</h2>
          <p>Painel Administrativo</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input type="email" placeholder="E-mail" required defaultValue="admin@igreja.com" />
          </div>
          
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input type="password" placeholder="Senha" required defaultValue="123456" />
          </div>
          
          <button type="submit" className="btn-primary login-btn">
            Entrar no Painel
          </button>
        </form>
      </div>
    </div>
  );
}
