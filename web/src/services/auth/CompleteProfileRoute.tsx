import { Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from './AuthContext';

interface CompleteProfileRouteProps {
  children: ReactElement;
}

export default function CompleteProfileRoute({ children }: CompleteProfileRouteProps) {
  const { authState } = useAuth();

  if (authState === 'AUTH_LOADING') {
    return (
      <div className="page page-placeholder" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Carregando dados cadastrais...</p>
        </div>
      </div>
    );
  }

  if (authState === 'UNAUTHENTICATED') {
    return <Navigate to="/login" replace />;
  }

  if (authState === 'AUTHENTICATED_PROFILE_COMPLETE') {
    return <Navigate to="/" replace />;
  }

  return children;
}
