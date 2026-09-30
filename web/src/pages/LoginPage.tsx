import { Link, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { ShieldCheck, LogIn, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import { mapAuthError } from '../utils/authErrors';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, resetPassword, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const displayError = error || authError;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    if (!password) {
      setError('Por favor, informe sua senha.');
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedEmail, password);
      // O roteador avaliará o estado e encaminhará para '/' ou '/complete-profile'
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // O roteador avaliará o estado e encaminhará para '/' ou '/complete-profile'
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setError('Informe o e-mail cadastrado para recuperação de senha.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(targetEmail);
      setInfo(`Enviamos as instruções de redefinição para o e-mail: ${targetEmail}. Verifique sua caixa de entrada.`);
      setShowForgot(false);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'var(--bg-main)' }}>
      <div className="ind-card" style={{ width: 'min(460px, 100%)', padding: '32px 28px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Sistema PEMT
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Inspeção e Conformidade de Plataformas Elevatórias (NR-18 / NR-35)
          </p>
        </div>

        {displayError && (
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--danger-subtle)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        {info && (
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--primary-subtle)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#60a5fa',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Info size={16} />
            <span>{info}</span>
          </div>
        )}

        {!showForgot ? (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Senha</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgot(true);
                    setError(null);
                    setInfo(null);
                  }}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.78rem', padding: 0, cursor: 'pointer' }}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '6px', padding: '12px' }}
            >
              <LogIn size={16} />
              <span>{isLoading ? 'Autenticando...' : 'Entrar com E-mail e Senha'}</span>
            </button>

            <div style={{ position: 'relative', textAlign: 'center', margin: '8px 0' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ position: 'relative', background: 'var(--bg-card)', padding: '0 8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                ou
              </span>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>Entrar com Google</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Ainda não tem conta?{' '}
              <Link to="/register" style={{ fontWeight: 600, color: '#38bdf8' }}>
                Criar uma conta
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label>E-mail Cadastrado</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%' }}>
              <span>{isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowForgot(false)}
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              <span>Voltar ao Login</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
