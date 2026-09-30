import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  AlertCircle,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Check,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import { vincularEmpresaPorCodigo } from '../firebase/firebaseProfile';

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, profile, authState, refreshProfile, logout } = useAuth();

  // Dados do Inspetor
  const [nome, setNome] = useState('');
  const [crea, setCrea] = useState('');

  // Código da Empresa
  const [codigoEmpresaInput, setCodigoEmpresaInput] = useState('');

  // Estados de submissão e feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Pré-popula dados existentes do perfil
  useEffect(() => {
    if (profile?.nome) {
      setNome(profile.nome);
    } else if (user?.name) {
      setNome(user.name);
    }

    if (profile?.crea) {
      setCrea(profile.crea);
    }
  }, [profile, user]);

  // Redireciona se perfil já estiver 100% completo
  useEffect(() => {
    if (authState === 'AUTHENTICATED_PROFILE_COMPLETE') {
      navigate('/');
    }
  }, [authState, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const trimmedNome = nome.trim();
    if (!trimmedNome) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    const normalizedCode = codigoEmpresaInput.trim().toUpperCase();
    const codeRegex = /^PEMT-[A-Z0-9]{6}$/;
    if (!normalizedCode || !codeRegex.test(normalizedCode)) {
      setError('Informe um código de empresa válido no formato PEMT-XXXXXX.');
      return;
    }

    setIsSubmitting(true);
    try {
      await vincularEmpresaPorCodigo(normalizedCode, {
        nome: trimmedNome,
        crea: crea.trim() || null
      });

      await refreshProfile();
      setSuccessNotice('Empresa vinculada com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      console.error('[CompleteProfilePage] Falha ao vincular empresa:', err);
      const msg = err?.message || '';
      if (msg.includes('not-found') || msg.includes('Código da Empresa não encontrado')) {
        setError('Código da Empresa não encontrado. Verifique com seu administrador.');
      } else if (msg.includes('already-exists') || msg.includes('já está vinculado')) {
        setError('Seu perfil já está vinculado a uma empresa.');
      } else {
        setError(msg || 'Não foi possível vincular a empresa. Verifique o código e tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'var(--bg-main)' }}>
      <div className="ind-card" style={{ width: 'min(640px, 100%)', padding: '32px 28px' }}>
        
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Building2 size={20} />
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Conclusão de Cadastro & Vinculação
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Informe seus dados profissionais e o código fornecido pela sua empresa para concluir o acesso.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sair da conta"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>

        {/* Mensagens de Sucesso e Erro */}
        {successNotice && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#4ade80',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successNotice}</span>
          </div>
        )}

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

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
          
          {/* SEÇÃO 1: DADOS PESSOAIS DO INSPETOR */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>1. Dados do Inspetor Técnico</span>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>E-mail Conectado</label>
                <input
                  type="email"
                  value={user?.email || profile?.email || ''}
                  disabled
                  style={{
                    width: '100%',
                    opacity: 0.7,
                    background: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Nome Completo <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Souza"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Registro CREA / CFT (Opcional)
                  </label>
                  <input
                    type="text"
                    value={crea}
                    onChange={(e) => setCrea(e.target.value)}
                    placeholder="Ex: 5061234567-SP"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: CÓDIGO DA EMPRESA */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>2. Vinculação por Código da Empresa</span>
              <span style={{ color: '#f87171' }}>*</span>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Código da Empresa <span style={{ color: '#f87171' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="input-codigo-empresa"
                  value={codigoEmpresaInput}
                  onChange={(e) => setCodigoEmpresaInput(e.target.value.toUpperCase())}
                  placeholder="Ex: PEMT-9H2R8V"
                  required
                  disabled={isSubmitting}
                  style={{ width: '100%', paddingLeft: '38px', fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '1px' }}
                />
                <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Informe o código fornecido pelo responsável pela sua empresa (formato PEMT-XXXXXX).
              </p>
            </div>
          </div>

          {/* BOTÃO PRINCIPAL DE SUBMISSÃO E ENTRADA NO SISTEMA */}
          <button
            type="submit"
            id="btn-complete-profile-submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              padding: '14px',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Validando Código e Acessando...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Vincular Empresa, Concluir Perfil e Acessar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
