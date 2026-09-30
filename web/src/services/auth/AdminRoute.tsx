import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { ReactNode } from 'react';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary, #0f172a)', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Verificando privilégios administrativos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdminUser = profile?.perfil === 'ADMIN' || profile?.perfil === 'ADMINISTRADOR';

  if (!isAdminUser) {
    return (
      <div className="page-container" style={{ maxWidth: '600px', textAlign: 'center', marginTop: '60px' }}>
        <div className="ind-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '12px' }}>
            Acesso Restrito a Administradores
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Sua conta possui perfil de Usuário Comum. Você não possui permissão para acessar o Painel Administrativo de Empresas e Usuários.
          </p>
          <a href="/" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
