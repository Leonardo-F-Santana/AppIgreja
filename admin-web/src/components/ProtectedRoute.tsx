import { Navigate } from 'react-router-dom';
import { useAuth, getRotaInicial } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  /** Cargos explicitamente bloqueados nesta rota */
  deniedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles, deniedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Enquanto carrega, mostra indicador de loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se allowedRoles foi definido e o role do utilizador não está incluído,
  // ou se o role está explicitamente bloqueado
  if (
    (allowedRoles && !allowedRoles.includes(user.role)) ||
    (deniedRoles && deniedRoles.includes(user.role))
  ) {
    return <Navigate to={getRotaInicial(user.role)} replace />;
  }

  return <>{children}</>;
}
