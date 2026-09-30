import { useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { ShieldCheck, LogIn, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import { mapAuthError } from '../utils/authErrors';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const displayError = error || authError;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Por favor, informe seu usuário.');
      return;
    }
    if (!password) {
      setError('Por favor, informe sua senha.');
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedUsername, password);
      // O roteador avaliará o estado e encaminhará para '/'
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

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu usuário"
              autoComplete="username"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label style={{ margin: 0 }}>Senha</label>
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
            <span>{isLoading ? 'Autenticando...' : 'ENTRAR'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
