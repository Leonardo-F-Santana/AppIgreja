import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Newspaper, Bell, Heart, LogOut, Settings } from 'lucide-react';
import './MainLayout.css';

export default function MainLayout() {
  const menuItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/noticias', icon: <Newspaper size={20} />, label: 'Notícias & Eventos' },
    { path: '/avisos', icon: <Bell size={20} />, label: 'Avisos' },
    { path: '/doacoes', icon: <Heart size={20} />, label: 'Doações' },
    { path: '/configuracoes', icon: <Settings size={20} />, label: 'Configurações' },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar - Glassmorphism */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo-placeholder">
            {/* O ideal seria importar a logo real da igreja aqui */}
            <h2>MINISTÉRIO IDE</h2>
            <span className="badge">Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-title">MENU PRINCIPAL</p>
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar glass-panel">
          <div className="greeting">
            <h3>Bem-vindo, Leonardo</h3>
            <p>Aqui está o resumo de hoje.</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <div className="user-profile">
              <div className="avatar">L</div>
            </div>
          </div>
        </header>

        <div className="content-area animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
