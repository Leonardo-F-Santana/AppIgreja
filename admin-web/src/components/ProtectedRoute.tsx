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

  if (user.role === 'membro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Acesso Restrito</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Para acessar os cultos, mídias e devocionais, por favor, faça o login diretamente no nosso Aplicativo Móvel.
          </p>
          <button
            onClick={() => { /* o signout está acessível via hook! */ }}
            className="mt-2 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors hidden"
          />
          <LogoutButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <button
      onClick={() => signOut()}
      className="mt-2 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
    >
      Sair / Fazer Logout
    </button>
  );
}
