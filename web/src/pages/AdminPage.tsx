import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Building2, Users, Plus, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Key, Copy, Check } from 'lucide-react';
import { adminCreateCompany, adminCreateUser, adminUpdateCompany, adminToggleCompanyStatus } from '../services/admin/AdminService';
import { getCompanies, type GetCompaniesResult } from '../firebase/firebaseProfile';
import { firestoreInstance } from '../firebase/firebaseApp';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Company } from '../types/company';

interface UserRecordItem {
  uid: string;
  nome: string;
  email?: string;
  empresaId: string;
  empresaNome?: string;
  perfil: string;
  codigoPessoal?: string;
  criadoEm?: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'empresas' | 'usuarios' | 'lista'>('empresas');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);

  // States for Company Creation
  const [cnpj, setCnpj] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [razaoSocial, RazaoSocial] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [createdCompanyResult, setCreatedCompanyResult] = useState<{ empresaId: string; empresaNome: string; codigoEmpresa: string } | null>(null);

  // States for User Creation
  const [userName, setUserName] = useState('');
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [userProfile, setUserProfile] = useState<'ADMIN' | 'USUARIO' | 'TECNICO'>('USUARIO');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createdUserResult, setCreatedUserResult] = useState<{ uid: string; codigoPessoal: string } | null>(null);

  // Lists for overview
  const [companiesResult, setCompaniesResult] = useState<GetCompaniesResult | null>(null);
  const [usersList, setUsersList] = useState<UserRecordItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // States for Company Editing & Status Toggle
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editRazaoSocial, setEditRazaoSocial] = useState('');
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);

  const handleStartEdit = (c: Company) => {
    setEditingCompany(c);
    setEditNome(c.nome || c.name || '');
    setEditRazaoSocial(c.razaoSocial || c.nome || c.name || '');
  };

  const handleUpdateCompanySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    const empresaId = editingCompany.empresaId || editingCompany.id || '';
    if (!empresaId || !editNome.trim()) return;

    setIsUpdatingCompany(true);
    setMessage(null);
    try {
      await adminUpdateCompany({
        empresaId,
        nome: editNome.trim(),
        razaoSocial: editRazaoSocial.trim() || editNome.trim()
      });
      setMessage({ type: 'success', text: `Empresa "${editNome}" atualizada com sucesso!` });
      setEditingCompany(null);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Falha ao atualizar empresa.', details: err?.message || String(err) });
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const handleToggleStatus = async (c: Company) => {
    const empresaId = c.empresaId || c.id || '';
    const currentAtivo = c.ativo !== false;
    const actionName = currentAtivo ? 'desativar' : 'ativar';

    if (!window.confirm(`Deseja realmente ${actionName} a empresa "${c.nome || c.name}"?\n\n${currentAtivo ? 'Usuários vinculados não poderão realizar novas operações enquanto a empresa estiver inativa. Os históricos e laudos serão preservados.' : 'A empresa voltará a operar normalmente.'}`)) {
      return;
    }

    setMessage(null);
    try {
      await adminToggleCompanyStatus({
        empresaId,
        ativo: !currentAtivo
      });
      setMessage({ type: 'success', text: `Empresa "${c.nome || c.name}" foi ${currentAtivo ? 'desativada' : 'ativada'} com sucesso!` });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Falha ao alterar status da empresa.', details: err?.message || String(err) });
    }
  };

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const compRes = await getCompanies();
      setCompaniesResult(compRes);
      if (compRes.companies.length > 0 && !selectedEmpresaId) {
        setSelectedEmpresaId(compRes.companies[0].empresaId || compRes.companies[0].id || '');
      }

      if (firestoreInstance) {
        try {
          const q = query(collection(firestoreInstance, 'usuarios'), orderBy('criadoEm', 'desc'));
          const snap = await getDocs(q);
          const list: UserRecordItem[] = snap.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              uid: docSnap.id,
              nome: data.nome || data.name || 'Usuário',
              email: data.email || '',
              empresaId: data.empresaId || '',
              empresaNome: data.empresaNome || '',
              perfil: data.perfil || 'USUARIO',
              codigoPessoal: data.codigoPessoal || '',
              criadoEm: data.criadoEm || data.dataCriacao || Date.now()
            };
          });
          setUsersList(list);
        } catch (e) {
          console.warn('Aviso ao carregar usuários:', e);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar dados administrativos:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedEmpresaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCompany = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setCreatedCompanyResult(null);

    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (!cleanCnpj || cleanCnpj.length !== 14) {
      setMessage({ type: 'error', text: 'O CNPJ deve conter exatamente 14 dígitos numéricos.' });
      return;
    }
    if (!nomeEmpresa.trim()) {
      setMessage({ type: 'error', text: 'O nome da empresa é obrigatório.' });
      return;
    }

    setIsCreatingCompany(true);
    try {
      const result = await adminCreateCompany({
        cnpj: cleanCnpj,
        nome: nomeEmpresa.trim(),
        razaoSocial: razaoSocial.trim() || nomeEmpresa.trim()
      });
      setCreatedCompanyResult(result);
      setMessage({ type: 'success', text: `Empresa "${result.empresaNome}" cadastrada com sucesso! Código gerado: ${result.codigoEmpresa}` });
      setCnpj('');
      setNomeEmpresa('');
      RazaoSocial('');
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Falha ao cadastrar empresa.', details: err?.message || String(err) });
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setCreatedUserResult(null);

    if (!userName.trim()) {
      setMessage({ type: 'error', text: 'O nome do usuário é obrigatório.' });
      return;
    }
    if (!selectedEmpresaId) {
      setMessage({ type: 'error', text: 'Selecione uma empresa vinculada.' });
      return;
    }

    setIsCreatingUser(true);
    try {
      const result = await adminCreateUser({
        nome: userName.trim(),
        empresaId: selectedEmpresaId,
        perfil: userProfile
      });
      setCreatedUserResult(result);
      setMessage({ type: 'success', text: `Usuário "${userName}" criado com sucesso! Código Pessoal gerado: ${result.codigoPessoal}` });
      setUserName('');
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Falha ao cadastrar usuário.', details: err?.message || String(err) });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const companiesList: Company[] = companiesResult?.companies || [];

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="#38bdf8" />
            <span>Painel Administrativo PEMT</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Gerenciamento centralizado de empresas, códigos de acesso e contas de usuários (Segurança Cloud Functions V2).
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={isLoadingData}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={isLoadingData ? 'animate-spin' : ''} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.875rem',
            background: message.type === 'success' ? 'var(--success-subtle, rgba(34,197,94,0.1))' : 'var(--danger-subtle, rgba(239,68,68,0.1))',
            border: message.type === 'success' ? '1px solid var(--success-border, rgba(34,197,94,0.3))' : '1px solid var(--danger-border, rgba(239,68,68,0.3))',
            color: message.type === 'success' ? '#4ade80' : '#f87171'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: message.details ? '4px' : 0 }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{message.text}</span>
          </div>
          {message.details && (
            <div style={{ fontSize: '0.78rem', opacity: 0.85, fontFamily: 'monospace', marginTop: '4px' }}>
              {message.details}
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '24px' }}>
        {[
          { id: 'empresas', label: 'Cadastrar Empresa', icon: Building2 },
          { id: 'usuarios', label: 'Cadastrar Usuário', icon: Users },
          { id: 'lista', label: `Visão Geral (${companiesList.length} Empresas / ${usersList.length} Usuários)`, icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? '1px solid #38bdf8' : '1px solid transparent',
                background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                color: isActive ? '#38bdf8' : 'var(--text-secondary)'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CADASTRAR EMPRESA */}
      {activeTab === 'empresas' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <Building2 size={18} color="#38bdf8" />
                <span>Nova Empresa (adminCreateCompany)</span>
              </div>
              <span className="badge badge-primary">Cloud Function V2</span>
            </div>

            <form onSubmit={handleCreateCompany} style={{ display: 'grid', gap: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                O sistema gerará automaticamente o <strong>codigoEmpresa</strong> único (ex: <code>PEMT-XXXXXX</code>) e reservará a chave de unicidade de forma atômica no Firestore.
              </p>

              <div className="grid-2">
                <div>
                  <label>CNPJ da Empresa *</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="04.316.103/0001-16"
                    disabled={isCreatingCompany}
                    required
                  />
                </div>
                <div>
                  <label>Nome Fantasia / Nome Comercial *</label>
                  <input
                    type="text"
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    placeholder="Ex: Tesla Brasil Ltda"
                    disabled={isCreatingCompany}
                    required
                  />
                </div>
              </div>

              <div>
                <label>Razão Social (Opcional)</label>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => RazaoSocial(e.target.value)}
                  placeholder="Ex: Tesla Indústria e Comércio de Veículos Ltda"
                  disabled={isCreatingCompany}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" disabled={isCreatingCompany} style={{ minWidth: '200px' }}>
                  <Plus size={16} />
                  <span>{isCreatingCompany ? 'Cadastrando...' : 'Cadastrar Empresa'}</span>
                </button>
              </div>
            </form>
          </div>

          {createdCompanyResult && (
            <div className="ind-card" style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <div className="ind-card-header">
                <div className="ind-card-title" style={{ color: '#4ade80' }}>
                  <CheckCircle2 size={18} />
                  <span>Empresa Cadastrada com Sucesso!</span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem' }}>
                <div><strong>ID (CNPJ limpo):</strong> <code style={{ fontFamily: 'monospace' }}>{createdCompanyResult.empresaId}</code></div>
                <div><strong>Nome:</strong> {createdCompanyResult.empresaNome}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <strong>Código da Empresa:</strong>
                  <code style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '4px', fontWeight: 700, fontSize: '1rem' }}>
                    {createdCompanyResult.codigoEmpresa}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCompanyResult.codigoEmpresa)}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    {copiedCode === createdCompanyResult.codigoEmpresa ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                    <span>{copiedCode === createdCompanyResult.codigoEmpresa ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#4ade80', margin: '4px 0 0', fontWeight: 500 }}>
                  ℹ️ Compartilhe este código com os usuários da empresa para que possam concluir o vínculo e acessar o sistema.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CADASTRAR USUÁRIO */}
      {activeTab === 'usuarios' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <Users size={18} color="#38bdf8" />
                <span>Novo Usuário (adminCreateUser)</span>
              </div>
              <span className="badge badge-primary">Cloud Function V2</span>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Cria uma identidade real no Firebase Authentication, gera o <strong>codigoPessoal</strong> único (ex: <code>PESS-XXXXXX</code>) e registra o perfil na coleção <code>usuarios</code>.
              </p>

              <div className="grid-2">
                <div>
                  <label>Nome Completo do Usuário *</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    disabled={isCreatingUser}
                    required
                  />
                </div>

                <div>
                  <label>Empresa Vinculada *</label>
                  <select
                    value={selectedEmpresaId}
                    onChange={(e) => setSelectedEmpresaId(e.target.value)}
                    disabled={isCreatingUser || companiesList.length === 0}
                    required
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                  >
                    {companiesList.length === 0 ? (
                      <option value="">Nenhuma empresa cadastrada</option>
                    ) : (
                      companiesList.map((c) => {
                        const id = c.empresaId || c.id || '';
                        return (
                          <option key={id} value={id}>
                            {c.nome || c.name || id} {c.codigoEmpresa ? `(${c.codigoEmpresa})` : ''}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label>Nível de Perfil / Acesso *</label>
                <select
                  value={userProfile}
                  onChange={(e) => setUserProfile(e.target.value as any)}
                  disabled={isCreatingUser}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                >
                  <option value="USUARIO">USUARIO — Usuário Comum (Inspeções e Laudos)</option>
                  <option value="TECNICO">TECNICO — Técnico Especialista PEMT</option>
                  <option value="ADMIN">ADMIN — Administrador da Empresa / Sistema</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" disabled={isCreatingUser || companiesList.length === 0} style={{ minWidth: '200px' }}>
                  <Plus size={16} />
                  <span>{isCreatingUser ? 'Criando Usuário...' : 'Cadastrar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>

          {createdUserResult && (
            <div className="ind-card" style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <div className="ind-card-header">
                <div className="ind-card-title" style={{ color: '#4ade80' }}>
                  <CheckCircle2 size={18} />
                  <span>Usuário Criado com Sucesso!</span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem' }}>
                <div><strong>Auth UID:</strong> <code style={{ fontFamily: 'monospace' }}>{createdUserResult.uid}</code></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong>Código Pessoal (para login):</strong>
                  <code style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '4px', fontWeight: 700, fontSize: '1rem' }}>
                    {createdUserResult.codigoPessoal}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdUserResult.codigoPessoal)}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    {copiedCode === createdUserResult.codigoPessoal ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                    <span>{copiedCode === createdUserResult.codigoPessoal ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VISÃO GERAL */}
      {activeTab === 'lista' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Empresas Cadastradas */}
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <Building2 size={18} color="#38bdf8" />
                <span>Empresas Cadastradas ({companiesList.length})</span>
              </div>
            </div>
            {companiesList.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px' }}>Nome / Razão Social</th>
                      <th style={{ padding: '10px' }}>CNPJ</th>
                      <th style={{ padding: '10px' }}>Código</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companiesList.map((c) => {
                      const id = c.empresaId || c.id || '';
                      const isAtiva = c.ativo !== false;
                      return (
                        <tr key={id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.nome || c.name}</td>
                          <td style={{ padding: '10px', fontFamily: 'monospace' }}>{c.cnpj || id}</td>
                          <td style={{ padding: '10px' }}>
                            <code style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              {c.codigoEmpresa || 'N/D'}
                            </code>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span className={`badge ${isAtiva ? 'badge-approved' : 'badge-rejected'}`}>
                              {isAtiva ? 'ATIVA' : 'INATIVA'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(c)}
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(c)}
                                className={isAtiva ? 'btn-secondary' : 'btn-primary'}
                                style={{ padding: '4px 8px', fontSize: '0.75rem', background: isAtiva ? 'rgba(239, 68, 68, 0.1)' : undefined, color: isAtiva ? '#f87171' : undefined }}
                              >
                                {isAtiva ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Nenhuma empresa cadastrada.
              </div>
            )}
          </div>

          {/* Modal de Edição de Empresa */}
          {editingCompany && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
              <div className="ind-card" style={{ width: 'min(500px, 100%)', padding: '28px' }}>
                <div className="ind-card-header" style={{ marginBottom: '16px' }}>
                  <div className="ind-card-title">
                    <Building2 size={18} color="#38bdf8" />
                    <span>Editar Empresa</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCompany(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleUpdateCompanySubmit} style={{ display: 'grid', gap: '14px' }}>
                  <div>
                    <label>Nome Comercial / Fantasia *</label>
                    <input
                      type="text"
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      required
                      disabled={isUpdatingCompany}
                    />
                  </div>
                  <div>
                    <label>Razão Social</label>
                    <input
                      type="text"
                      value={editRazaoSocial}
                      onChange={(e) => setEditRazaoSocial(e.target.value)}
                      disabled={isUpdatingCompany}
                    />
                  </div>
                  <div>
                    <label>CNPJ (Somente leitura)</label>
                    <input
                      type="text"
                      value={editingCompany.cnpj || editingCompany.empresaId || ''}
                      disabled
                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingCompany(null)}
                      className="btn-secondary"
                      disabled={isUpdatingCompany}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isUpdatingCompany}
                    >
                      {isUpdatingCompany ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Usuários Cadastrados */}
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <Users size={18} color="#38bdf8" />
                <span>Usuários Registrados ({usersList.length})</span>
              </div>
            </div>
            {usersList.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px' }}>Nome</th>
                      <th style={{ padding: '10px' }}>E-mail</th>
                      <th style={{ padding: '10px' }}>Perfil</th>
                      <th style={{ padding: '10px' }}>Código Pessoal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.uid} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.nome}</td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{u.email || '-'}</td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge ${u.perfil === 'ADMIN' ? 'badge-primary' : 'badge-neutral'}`}>
                            {u.perfil}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <code style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {u.codigoPessoal || 'N/D'}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Nenhum usuário encontrado na coleção usuarios.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
