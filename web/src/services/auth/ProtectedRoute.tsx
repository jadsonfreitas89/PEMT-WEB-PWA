import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authState, systemInitialized, checkingSystemInit } = useAuth();
  const location = useLocation();

  if (authState === 'AUTH_LOADING' || checkingSystemInit) {
    return (
      <div className="page page-placeholder" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Verificando inicialização do sistema...</p>
        </div>
      </div>
    );
  }

  if (authState === 'UNAUTHENTICATED') {
    return <Navigate to="/login" replace />;
  }

  // REGRA 1: Se o sistema NÃO estiver inicializado, prioridade absoluta para /initial-setup
  if (!systemInitialized) {
    if (location.pathname !== '/initial-setup' && location.pathname !== '/setup') {
      return <Navigate to="/initial-setup" replace />;
    }
  }

  if (authState === 'AUTHENTICATED_NO_PROFILE' || authState === 'AUTHENTICATED_PROFILE_INCOMPLETE') {
    console.log('[ONBOARDING_DEBUG] Usuário com perfil incompleto na rota:', location.pathname);
    if (location.pathname !== '/setup' && location.pathname !== '/initial-setup') {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  return children;
}
