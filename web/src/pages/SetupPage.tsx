import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import { saveCompany, getCompany, type UserProfile } from '../firebase/firebaseProfile';

export default function SetupPage() {
  const navigate = useNavigate();
  const { user, profile, companyId, companyName, updateProfile, completeProfile } = useAuth();

  const [nome, setNome] = useState(companyName || '');
  const [cnpj, setCnpj] = useState('');
  const [responsavel, setResponsavel] = useState(profile?.nome || user?.name || '');
  const [crea, setCrea] = useState(profile?.crea || '');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [telefone, setTelefone] = useState(profile?.telefone || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || companyId === 'EMAIL_PENDING' || companyId === 'GOOGLE_PENDING') return;

    setIsLoading(true);
    getCompany(companyId)
      .then((comp) => {
        if (comp) {
          if (comp.nome || comp.name) setNome(comp.nome || comp.name || '');
          if (comp.cnpj) setCnpj(comp.cnpj);
          if (comp.cidade || comp.city) setCidade(comp.cidade || comp.city || '');
          if (comp.estado || comp.state) setEstado(comp.estado || comp.state || '');
          if (comp.telefone || comp.phone) setTelefone(comp.telefone || comp.phone || '');
          if (comp.email) setEmail(comp.email);
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar dados da empresa:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [companyId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedNome = nome.trim();
    const trimmedCnpj = cnpj.trim();
    const cleanCnpj = trimmedCnpj.replace(/\D/g, '');

    if (!trimmedNome) {
      setError('Por favor, informe a Razão Social da Empresa.');
      return;
    }
    if (!trimmedCnpj) {
      setError('Por favor, informe o CNPJ da Empresa.');
      return;
    }
    if (cleanCnpj.length !== 14) {
      setError('O CNPJ deve conter exatamente 14 dígitos numéricos.');
      return;
    }

    setIsSaving(true);
    try {
      const isExistingCompanyContext = Boolean(companyId && companyId !== 'EMAIL_PENDING' && companyId !== 'GOOGLE_PENDING');
      const targetEmpresaId = isExistingCompanyContext ? companyId : cleanCnpj;

      const saved = await saveCompany({
        empresaId: targetEmpresaId,
        nome: trimmedNome,
        cnpj: trimmedCnpj,
        telefone: telefone.trim(),
        email: email.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        status: 'ATIVO',
        plano: 'FREE',
        responsible: responsavel.trim(),
        crea: crea.trim()
      });

      const finalEmpresaId = saved.empresaId || saved.id;
      const finalEmpresaNome = saved.nome || saved.name || trimmedNome;

      if (!finalEmpresaId) {
        throw new Error('Falha ao obter identificador da empresa salva.');
      }

      // Se o usuário está em fluxo de cadastro inicial / pendente, conclui o perfil oficial
      if (
        !profile?.empresaId ||
        profile.empresaId === 'EMAIL_PENDING' ||
        profile.empresaId === 'GOOGLE_PENDING'
      ) {
        await completeProfile({
          nome: responsavel.trim() || profile?.nome || user?.name || 'Inspetor',
          crea: crea.trim() || null,
          empresaId: finalEmpresaId,
          empresaNome: finalEmpresaNome
        });
      } else {
        const updatedProfileData: Partial<UserProfile> = {
          empresaId: finalEmpresaId,
          empresaNome: finalEmpresaNome,
          nome: responsavel.trim() || profile?.nome || user?.name || 'Inspetor',
          crea: crea.trim() || null,
          telefone: telefone.trim()
        };
        await updateProfile(updatedProfileData);
      }

      setSuccess('Dados da empresa atualizados com sucesso!');

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao salvar empresa:', err);
      setError(err?.message || 'Ocorreu um erro ao salvar as informações da empresa. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)' }}>
      <div className="ind-card" style={{ width: 'min(640px, 100%)', padding: '32px 28px' }}>
        {/* Header */}
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
              margin: '0 auto 12px'
            }}
          >
            <Building2 size={26} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Configure sua empresa
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Dados cadastrais e responsável técnico para emissão de laudos.
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

        {success && (
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--success-subtle)',
              border: '1px solid var(--success-border)',
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
            <span>{success}</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <p>Carregando dados da empresa...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Preenchimento de Teste:</span>
              <button
                type="button"
                onClick={() => {
                  setNome('Tesla Brasil Ltda');
                  setCnpj('04.316.103/0001-16');
                  setCidade('São Paulo');
                  setEstado('SP');
                  setTelefone('(11) 3456-7890');
                  setEmail('contato@tesla.com.br');
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  cursor: 'pointer'
                }}
              >
                ⚡ Preencher Tesla Brasil
              </button>
            </div>

            <div className="grid-2">
              <div>
                <label>Razão Social / Nome da Empresa *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Rental Equipamentos LTDA"
                  disabled={isSaving}
                  required
                />
              </div>

              <div>
                <label>CNPJ *</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label>Responsável Técnico</label>
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Nome do Responsável"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label>CREA / Registro Técnico</label>
                <input
                  type="text"
                  value={crea}
                  onChange={(e) => setCrea(e.target.value)}
                  placeholder="Ex: CREA-SP 123456/D"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label>Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Cidade"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label>Estado (UF)</label>
                <input
                  type="text"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label>Telefone Comercial</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 0000-0000"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label>E-mail Corporativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/')}
                disabled={isSaving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Salvando...' : 'Salvar e continuar'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
