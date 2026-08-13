import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Avisos from './pages/Avisos';
import EventosPage from './pages/EventosPage';
import CelulasPage from './pages/CelulasPage';
import DoacoesPage from './pages/DoacoesPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';

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
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          {/* Rotas legadas mantidas para não quebrar links existentes */}
          <Route path="membros" element={<Navigate to="/dashboard" replace />} />
          <Route path="pedidos" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
