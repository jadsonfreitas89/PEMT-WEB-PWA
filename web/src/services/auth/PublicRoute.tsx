import { Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from './AuthContext';

interface PublicRouteProps {
  children: ReactElement;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { authState } = useAuth();

  if (authState === 'AUTH_LOADING') {
    return (
      <div className="page page-placeholder" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (authState === 'AUTHENTICATED_PROFILE_COMPLETE') {
    return <Navigate to="/" replace />;
  }

  if (authState === 'AUTHENTICATED_NO_PROFILE' || authState === 'AUTHENTICATED_PROFILE_INCOMPLETE') {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
}
