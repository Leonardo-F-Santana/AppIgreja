import { Users, TrendingUp, HandHeart, Calendar } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const stats = [
    { label: 'Membros Ativos', value: '432', icon: <Users size={24} />, color: 'var(--accent-blue)', trend: '+12%' },
    { label: 'Dízimos & Ofertas', value: 'R$ 12.450', icon: <TrendingUp size={24} />, color: 'var(--primary)', trend: '+5%' },
    { label: 'Pedidos de Oração', value: '28', icon: <HandHeart size={24} />, color: 'var(--accent-purple)', trend: '4 urgentes' },
    { label: 'Eventos Mês', value: '14', icon: <Calendar size={24} />, color: 'var(--accent-yellow)', trend: '2 próximos' }
  ];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card glass-panel animate-fade-in" style={{animationDelay: `${i * 0.1}s`}}>
            <div className="stat-header">
              <div className="stat-icon" style={{backgroundColor: `${stat.color}20`, color: stat.color}}>
                {stat.icon}
              </div>
              <span className="stat-trend">{stat.trend}</span>
            </div>
            <div className="stat-info">
              <h2>{stat.value}</h2>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="dashboard-content">
        <div className="recent-activity glass-panel animate-fade-in" style={{animationDelay: '0.4s'}}>
          <h3>Últimas Atividades</h3>
          <div className="activity-list">
             <p className="empty-state">Integração com banco de dados pendente.</p>
          </div>
        </div>
        <div className="quick-actions glass-panel animate-fade-in" style={{animationDelay: '0.5s'}}>
          <h3>Ações Rápidas</h3>
          <button className="btn-primary" style={{width: '100%', marginTop: '16px'}}>Publicar Aviso</button>
        </div>
      </div>
    </div>
  );
}
