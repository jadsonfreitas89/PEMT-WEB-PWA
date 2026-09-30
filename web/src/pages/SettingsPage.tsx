import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Plus,
  RefreshCw,
  Zap,
  Layers,
  Settings,
  UploadCloud
} from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import {
  getCompanies,
  saveCompany,
  clearLocalCachedCompanies,
  type GetCompaniesResult
} from '../firebase/firebaseProfile';
import type { Company } from '../types/company';

type TabId = 'perfil' | 'profissional' | 'empresa' | 'preferencias';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, companyName, companyId, updateProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('perfil');

  // Estados do Perfil
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [crea, setCrea] = useState('');

  // Preferências
  const [autoSaveLocal, setAutoSaveLocal] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);

  // Gestão de Empresa
  const [companiesResult, setCompaniesResult] = useState<GetCompaniesResult | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId || '');
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCnpj, setNewCompanyCnpj] = useState('');
  const [newCompanyCity, setNewCompanyCity] = useState('');
  const [newCompanyState, setNewCompanyState] = useState('');
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.nome || '');
      setPhone(profile.telefone || '');
      setRole(profile.cargo || '');
      setCrea(profile.crea || '');
      if (profile.empresaId) {
        setSelectedCompanyId(profile.empresaId);
      }
    }
  }, [profile]);

  const loadCompaniesList = useCallback(async () => {
    setIsLoadingCompanies(true);
    try {
      const res = await getCompanies();
      setCompaniesResult(res);
    } catch (e) {
      console.warn('Erro ao carregar lista de empresas:', e);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'empresa') {
      loadCompaniesList();
    }
  }, [activeTab, loadCompaniesList]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'O nome completo é obrigatório.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        nome: name.trim(),
        telefone: phone.trim(),
        cargo: role.trim(),
        crea: crea.trim() || null
      });
      await refreshProfile();
      setMessage({ type: 'success', text: 'Configurações e dados profissionais salvos com sucesso!' });
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
      setMessage({ type: 'error', text: 'Não foi possível atualizar as configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchCompany = async (targetId: string) => {
    if (!targetId || targetId === companyId) return;
    const target = (companiesResult?.companies || []).find((c) => (c.empresaId || c.id) === targetId);
    if (!target) return;

    setIsSaving(true);
    try {
      const finalId = target.empresaId || target.id || '';
      await updateProfile({
        empresaId: finalId,
        empresaNome: target.nome || target.name || 'Empresa'
      });
      await refreshProfile();
      setSelectedCompanyId(finalId);
      setMessage({ type: 'success', text: `Empresa alterada para "${target.nome || target.name}" com sucesso!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Falha ao vincular nova empresa.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceSaveCurrentCompanyToFirestore = async () => {
    setMessage(null);
    const targetName = companyName || profile?.empresaNome || 'Empresa';
    const rawCnpj = companyId || profile?.empresaId || '';
    const cleanCnpj = rawCnpj.replace(/\D/g, '') || '00000000000100';

    setIsSavingCompany(true);

    try {
      await saveCompany({
        empresaId: cleanCnpj,
        nome: targetName,
        cnpj: rawCnpj || cleanCnpj,
        cidade: '',
        estado: '',
        status: 'ATIVO',
        responsible: profile?.nome || '',
        crea: crea.trim()
      });

      clearLocalCachedCompanies();
      try {
        await loadCompaniesList();
      } catch {}
      
      setMessage({ type: 'success', text: `✅ Empresa "${targetName}" sincronizada com sucesso no Firestore!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao gravar empresa no Firestore.' });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleRegisterNewCompanyInSettings = async () => {
    setMessage(null);
    const trimmedName = newCompanyName.trim();
    const cleanCnpj = newCompanyCnpj.replace(/\D/g, '');

    if (!trimmedName) {
      setMessage({ type: 'error', text: 'Informe a Razão Social da empresa.' });
      return;
    }
    if (!cleanCnpj || cleanCnpj.length !== 14) {
      setMessage({ type: 'error', text: 'O CNPJ deve conter exatamente 14 números.' });
      return;
    }

    setIsSavingCompany(true);
    try {
      const saved = await saveCompany({
        empresaId: cleanCnpj,
        nome: trimmedName,
        cnpj: newCompanyCnpj.trim(),
        cidade: newCompanyCity.trim(),
        estado: newCompanyState.trim().toUpperCase(),
        status: 'ATIVO',
        responsible: name.trim() || profile?.nome || '',
        crea: crea.trim()
      });

      // Vincula ao usuário atual
      await updateProfile({
        empresaId: saved.empresaId || cleanCnpj,
        empresaNome: saved.nome || trimmedName
      });
      await refreshProfile();

      clearLocalCachedCompanies();
      await loadCompaniesList();
      setSelectedCompanyId(saved.empresaId || cleanCnpj);
      setShowNewCompanyForm(false);
      setMessage({ type: 'success', text: `Empresa "${saved.nome}" cadastrada no Firestore e vinculada ao seu perfil!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao cadastrar empresa no Firestore.' });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const companiesList: Company[] = companiesResult?.companies || [];

  return (
    <div className="page-container" style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Configurações do Sistema
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Gerencie dados cadastrais, empresas no Firestore, habilitação técnica e preferências.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.875rem',
            background: message.type === 'success' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
            border: message.type === 'success' ? '1px solid var(--success-border)' : '1px solid var(--danger-border)',
            color: message.type === 'success' ? '#4ade80' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginBottom: '24px'
        }}
      >
        {[
          { id: 'perfil', label: 'Meu Perfil', icon: User },
          { id: 'profissional', label: 'Dados Profissionais', icon: ShieldCheck },
          { id: 'empresa', label: 'Empresa & Firestore', icon: Building2 },
          { id: 'preferencias', label: 'Preferências', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                background: isActive ? 'var(--primary-subtle)' : 'transparent',
                color: isActive ? '#60a5fa' : 'var(--text-secondary)'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gap: '20px' }}>
        {/* TAB 1: PERFIL */}
        {activeTab === 'perfil' && (
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <User size={18} color="var(--primary)" />
                <span>Dados de Identificação</span>
              </div>
              <span className="badge badge-primary">Inspetor Técnico</span>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="grid-2">
                <div>
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    disabled={isSaving}
                    required
                  />
                </div>

                <div>
                  <label>E-mail da Conta</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label>Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label>Cargo / Função Operacional</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Inspetor Técnico de PEMT"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DADOS PROFISSIONAIS */}
        {activeTab === 'profissional' && (
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <ShieldCheck size={18} color="var(--primary)" />
                <span>Habilitação Técnica & Normas</span>
              </div>
              <span className="badge badge-neutral">NR-18 / NR-35</span>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="grid-2">
                <div>
                  <label>Registro Profissional (CREA / CFT)</label>
                  <input
                    type="text"
                    value={crea}
                    onChange={(e) => setCrea(e.target.value)}
                    placeholder="Ex: CREA 123456/D ou CFT 98765"
                    disabled={isSaving}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    O número de registro será impresso no cabeçalho e rodapé de todos os laudos técnicos emitidos.
                  </span>
                </div>

                <div>
                  <label>Nível de Acesso Técnico</label>
                  <input
                    type="text"
                    value={profile?.perfil === 'ADMIN' ? 'Administrador / Gestor Técnico' : 'Inspetor Técnico Habilitado'}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMPRESA & FIRESTORE */}
        {activeTab === 'empresa' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="ind-card">
              <div className="ind-card-header">
                <div className="ind-card-title">
                  <Building2 size={18} color="var(--primary)" />
                  <span>Empresa Atual Vinculada</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleForceSaveCurrentCompanyToFirestore}
                    disabled={isSavingCompany}
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', background: '#22c55e', borderColor: '#22c55e' }}
                  >
                    <UploadCloud size={14} />
                    <span>{isSavingCompany ? 'Gravando...' : 'Gravar esta Empresa no Firestore Agora'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/setup')}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    <Settings size={14} />
                    <span>Editar Dados da Empresa</span>
                  </button>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: '16px' }}>
                <div>
                  <label>Razão Social / Nome da Empresa</label>
                  <input
                    type="text"
                    value={companyName || profile?.empresaNome || 'Empresa'}
                    disabled
                    style={{ opacity: 0.8, cursor: 'not-allowed', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label>Identificador do Documento (ID/CNPJ)</label>
                  <input
                    type="text"
                    value={companyId || 'default_company'}
                    disabled
                    style={{ opacity: 0.8, cursor: 'not-allowed', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            {/* SELEÇÃO E CADASTRO DIRETO NO FIRESTORE */}
            <div className="ind-card">
              <div className="ind-card-header">
                <div className="ind-card-title">
                  <Layers size={18} color="#38bdf8" />
                  <span>Empresas Cadastradas no Firestore ({companiesList.length})</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={loadCompaniesList}
                    disabled={isLoadingCompanies}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                  >
                    <RefreshCw size={13} className={isLoadingCompanies ? 'animate-spin' : ''} />
                    <span>Recarregar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCompanyForm((v) => !v)}
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    <Plus size={14} />
                    <span>{showNewCompanyForm ? 'Fechar Cadastro' : '+ Cadastrar Nova Empresa'}</span>
                  </button>
                </div>
              </div>

              {/* FORMULÁRIO DE CADASTRO NOVO NO FIRESTORE */}
              {showNewCompanyForm && (
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(34, 197, 94, 0.04)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px',
                    display: 'grid',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Cadastrar Nova Empresa no Firestore
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCompanyName('Eletro Inspeções & Plataformas PEMT');
                          setNewCompanyCnpj('12.345.678/0001-90');
                          setNewCompanyCity('Curitiba');
                          setNewCompanyState('PR');
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Eletro PEMT (12.345.678)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCompanyName('Locações & Manutenção Elevaplatz');
                          setNewCompanyCnpj('45.678.901/0001-22');
                          setNewCompanyCity('Campinas');
                          setNewCompanyState('SP');
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Elevaplatz (45.678.901)
                      </button>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Razão Social *</label>
                      <input
                        type="text"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Ex: Tesla Brasil Ltda"
                        disabled={isSavingCompany}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>CNPJ *</label>
                      <input
                        type="text"
                        value={newCompanyCnpj}
                        onChange={(e) => setNewCompanyCnpj(e.target.value)}
                        placeholder="04.316.103/0001-16"
                        disabled={isSavingCompany}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Cidade</label>
                      <input
                        type="text"
                        value={newCompanyCity}
                        onChange={(e) => setNewCompanyCity(e.target.value)}
                        placeholder="São Paulo"
                        disabled={isSavingCompany}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>UF</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={newCompanyState}
                        onChange={(e) => setNewCompanyState(e.target.value.toUpperCase())}
                        placeholder="SP"
                        disabled={isSavingCompany}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setShowNewCompanyForm(false)}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleRegisterNewCompanyInSettings}
                      disabled={isSavingCompany}
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                    >
                      {isSavingCompany ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Gravando no Banco...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          <span>Gravar no Firestore e Vincular</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* LISTAGEM DE EMPRESAS PARA TROCA RÁPIDA */}
              {isLoadingCompanies ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                  <span>Carregando empresas do Firestore...</span>
                </div>
              ) : companiesList.length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {companiesList.map((comp) => {
                    const id = comp.empresaId || comp.id || '';
                    const isCurrent = id === companyId;
                    return (
                      <div
                        key={id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: isCurrent ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                          border: isCurrent ? '1px solid #38bdf8' : '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {comp.nome || comp.name || 'Empresa sem nome'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            CNPJ: {comp.cnpj || 'Não informado'} {comp.cidade ? `• ${comp.cidade}/${comp.estado || ''}` : ''}
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="badge badge-primary">Empresa Atual</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSwitchCompany(id)}
                            disabled={isSaving}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          >
                            Vincular a esta
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Nenhuma empresa cadastrada no banco. Use o botão acima "+ Cadastrar Nova Empresa" para criar uma.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PREFERÊNCIAS */}
        {activeTab === 'preferencias' && (
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <Sliders size={18} color="var(--primary)" />
                <span>Preferências de Operação e Offline</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoSaveLocal}
                  onChange={(e) => setAutoSaveLocal(e.target.checked)}
                  style={{ width: '18px', height: '18px', margin: 0 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'none', fontWeight: 500 }}>
                  Armazenar rascunhos e fotos localmente no dispositivo durante a inspeção
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={offlineSync}
                  onChange={(e) => setOfflineSync(e.target.checked)}
                  style={{ width: '18px', height: '18px', margin: 0 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'none', fontWeight: 500 }}>
                  Sincronização contínua com Firestore na nuvem quando houver conexão
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Botão de Salvar Perfil */}
        {activeTab !== 'empresa' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn-primary" disabled={isSaving} style={{ minWidth: '180px' }}>
              <Save size={16} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
