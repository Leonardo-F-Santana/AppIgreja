import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Avisos from './pages/Avisos';
import EventosPage from './pages/EventosPage';
import CelulasPage from './pages/CelulasPage';
import DoacoesPage from './pages/DoacoesPage';
import PedidosPage from './pages/PedidosPage';
import MembrosPage from './pages/MembrosPage';
import CultosPage from './pages/CultosPage';
import VisitantesPage from './pages/VisitantesPage';
import PerfilPage from './pages/PerfilPage';
import Financeiro from './pages/Financeiro';
import Equipe from './pages/Equipe';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas envelopadas pelo MainLayout */}
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="avisos" element={<Avisos />} />
            <Route path="eventos" element={<EventosPage />} />
            <Route path="celulas" element={<CelulasPage />} />
            <Route path="doacoes" element={<DoacoesPage />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="membros" element={<MembrosPage />} />
            <Route path="visitantes" element={<VisitantesPage />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="cultos" element={<CultosPage />} />
            <Route path="financeiro" element={
              <ProtectedRoute allowedRoles={['admin', 'tesouraria']}>
                <Financeiro />
              </ProtectedRoute>
            } />
            <Route path="equipe" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Equipe />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
