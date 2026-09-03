import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Bell, LogOut, 
  Users, User, HandHeart, Menu, X, Wallet, ShieldCheck, Church, UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Visão Geral' },
    { path: '/eventos', icon: <Calendar size={20} />, label: 'Eventos' },
    { path: '/cultos', icon: <Church size={20} />, label: 'Cultos' },
    { path: '/membros', icon: <User size={20} />, label: 'Membros' },
    { path: '/visitantes', icon: <UserPlus size={20} />, label: 'Visitantes', requiredRoles: ['admin', 'secretario', 'secretário', 'secretaria', 'secretária', 'lider', 'líder'] },
    { path: '/celulas', icon: <Users size={20} />, label: 'Células' },
    { path: '/avisos', icon: <Bell size={20} />, label: 'Avisos' },
    { path: '/financeiro', icon: <Wallet size={20} />, label: 'Financeiro', requiredRoles: ['admin', 'tesouraria'] },
    { path: '/pedidos', icon: <HandHeart size={20} />, label: 'Pedidos de Oração' },
    { path: '/equipe', icon: <ShieldCheck size={20} />, label: 'Equipe', requiredRoles: ['admin'] },
  ];

  // Filtra itens do menu com base no role do utilizador
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.requiredRoles) return true;
    const userRole = user?.role?.toLowerCase();
    return userRole && item.requiredRoles.includes(userRole);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 relative">
      
      {/* Overlay escuro p/ quando menu mobile estiver aberto */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full w-64 flex-shrink-0 bg-blue-900 text-white flex flex-col z-50
        transition-transform duration-300 ease-in-out transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-6 pb-8 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight">MINISTÉRIO IDE</h2>
            <div className="mt-1 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-blue-100 truncate max-w-[180px]" title={user?.nome || user?.email || ''}>
                {user?.nome || user?.email?.split('@')[0] || 'Administrador'}
              </span>
              <span className="text-[10px] font-bold bg-blue-800/60 text-blue-300 py-0.5 px-2 rounded w-max uppercase tracking-wider">
                {user?.role || 'Admin'}
              </span>
            </div>
          </div>
          <button 
            className="md:hidden text-blue-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto">
          <p className="text-[10px] font-bold text-blue-400/60 mb-4 px-3 tracking-widest uppercase">Menu Principal</p>
          <ul className="flex flex-col gap-1.5">
            {visibleMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-blue-100/70 hover:bg-blue-700/50 hover:text-white'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-800/40">
          <NavLink 
            to="/perfil"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-3 w-full rounded-xl text-sm font-medium transition-colors mb-2 ${isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}
          >
            <User size={20} />
            <span>Meu Perfil</span>
          </NavLink>
          
          <button 
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-sm font-medium text-red-300/90 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full bg-gray-100">
        {/* Topbar visível apenas no Mobile */}
        <div className="md:hidden bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-blue-900 tracking-tight">MINISTÉRIO IDE</h2>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
