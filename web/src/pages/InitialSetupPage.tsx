import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import { checkSystemInitialization, bootstrapInitialAdmin } from '../firebase/firebaseProfile';
import { getAuth } from 'firebase/auth';

export default function InitialSetupPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [checking, setChecking] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkSystemInitialization()
      .then((initialized) => {
        setIsInitialized(initialized);
      })
      .catch((err) => {
        console.error('Erro ao verificar inicialização:', err);
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  const handleBootstrap = async () => {
    if (!confirmed) {
      setError('Você deve confirmar a atribuição de privilégios administrativos.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Executa Cloud Function de Bootstrap
      await bootstrapInitialAdmin();

      // Força atualização do token do Firebase Auth para obter o Custom Claim `admin: true`
      const auth = getAuth();
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }

      // Atualiza o perfil no contexto local
      await refreshProfile();

      setSuccess('Configuração inicial concluída com sucesso! Redirecionando para o Painel Administrativo...');

      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 1500);
    } catch (err: any) {
      console.error('Erro no bootstrap inicial:', err);
      setError(err?.message || 'Não foi possível concluir a configuração inicial. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Verificando status do sistema...</p>
        </div>
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)', padding: '16px' }}>
        <div className="ind-card" style={{ width: 'min(500px, 100%)', padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Sistema já Configurado
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            O sistema PEMT já possui uma configuração inicial concluída e empresas cadastradas. O bootstrap não é mais necessário.
          </p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>Acessar o Sistema</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)', padding: '16px' }}>
      <div className="ind-card" style={{ width: 'min(560px, 100%)', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <ShieldAlert size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Configuração Inicial do Sistema
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Nenhuma empresa ou administrador foi configurado neste ambiente. Esta etapa define o administrador principal.
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 14px', background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ padding: '12px 14px', background: 'var(--success-subtle)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', color: '#4ade80', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Conta conectada atualmente:</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user?.email || 'Usuário autenticado'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>UID: {user?.uid}</div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={loading || Boolean(success)}
              style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              Tornar esta conta o <strong>administrador principal do sistema</strong>. Compreendo que esta ação só pode ser executada uma única vez e concederá controle administrativo total sobre o cadastro de empresas e usuários.
            </span>
          </label>
        </div>

        <button
          onClick={handleBootstrap}
          disabled={loading || !confirmed || Boolean(success)}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Configurando Administrador...</span>
            </>
          ) : (
            <>
              <span>Concluir Configuração Inicial</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
