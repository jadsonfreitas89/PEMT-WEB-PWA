import { Link, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import { mapAuthError } from '../utils/authErrors';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Informe seu nome completo.');
      return;
    }

    if (!trimmedEmail) {
      setError('Informe um endereço de e-mail.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Informe um e-mail com formato válido (ex: usuario@empresa.com).');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      await register(trimmedEmail, password, trimmedName);
      navigate('/complete-profile');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'var(--bg-main)' }}>
      <div className="ind-card" style={{ width: 'min(480px, 100%)', padding: '32px 28px' }}>
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
            Cadastro de Inspetor
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Acesso profissional ao sistema de homologação PEMT
          </p>
        </div>

        {error && (
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
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label>Nome Completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Eduardo Santos"
              autoComplete="name"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label>E-mail Corporativo *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos@engenharia.com.br"
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid-2">
            <div>
              <label>Senha *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mín. 6 dígitos"
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label>Confirmar Senha *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            <UserPlus size={16} />
            <span>{isLoading ? 'Criando Conta...' : 'Cadastrar e Prosseguir'}</span>
          </button>

          <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Já possui uma conta?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: '#38bdf8' }}>
              Entrar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
