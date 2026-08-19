import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Avisos from './pages/Avisos';
import EventosPage from './pages/EventosPage';
import CelulasPage from './pages/CelulasPage';
import DoacoesPage from './pages/DoacoesPage';
import PedidosPage from './pages/PedidosPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import MembrosPage from './pages/MembrosPage';
import Financeiro from './pages/Financeiro';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas envelopadas pelo MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="avisos" element={<Avisos />} />
          <Route path="eventos" element={<EventosPage />} />
          <Route path="celulas" element={<CelulasPage />} />
          <Route path="doacoes" element={<DoacoesPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          <Route path="membros" element={<MembrosPage />} />
          <Route path="financeiro" element={<Financeiro />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
