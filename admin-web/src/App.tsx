import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rotas protegidas envelopadas pelo MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="eventos" element={<div style={{padding: '20px'}}>Eventos em breve</div>} />
          <Route path="membros" element={<div style={{padding: '20px'}}>Membros em breve</div>} />
          <Route path="celulas" element={<div style={{padding: '20px'}}>Células em breve</div>} />
          <Route path="avisos" element={<div style={{padding: '20px'}}>Avisos em breve</div>} />
          <Route path="doacoes" element={<div style={{padding: '20px'}}>Doações em breve</div>} />
          <Route path="pedidos" element={<div style={{padding: '20px'}}>Pedidos de Oração em breve</div>} />
          <Route path="configuracoes" element={<div style={{padding: '20px'}}>Configurações em breve</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
