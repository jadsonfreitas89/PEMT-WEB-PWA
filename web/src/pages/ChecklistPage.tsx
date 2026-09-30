import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  FileDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  ShieldCheck,
  Check,
  Building2,
  Calendar,
  User,
  Clock,
  Gauge,
  X,
  History,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import {
  createInitialInspectionCategories,
  analyzeInspectionApproval
} from '../utils/inspectionTemplate';
import {
  saveInspectionToFirestore,
  getPlatforms,
  savePlatform
} from '../firebase/firebaseInspection';
import { downloadInspectionPdf } from '../utils/pdfGenerator';
import SignatureCanvas from '../components/SignatureCanvas';
import PhotoUploader from '../components/PhotoUploader';
import InspectionStepper, { type StepItem } from '../components/InspectionStepper';
import ChecklistCategorySection from '../components/ChecklistCategorySection';
import type {
  Inspection,
  InspectionCategory,
  InspectionPhoto,
  InspectionItemStatus
} from '../types/inspection';
import type { Platform } from '../types/platform';

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: StepItem[] = [
  { id: 1, label: 'Equipamento', short: '01' },
  { id: 2, label: 'Checklist', short: '02' },
  { id: 3, label: 'Evidências', short: '03' },
  { id: 4, label: 'Parecer', short: '04' },
  { id: 5, label: 'Finalização', short: '05' }
];

export default function ChecklistPage() {
  const navigate = useNavigate();
  const { user, profile, companyId, companyName } = useAuth();

  const [step, setStep] = useState<Step>(1);

  // Equipamento & Inspetor
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('');
  const [modelo, setModelo] = useState<string>('');
  const [numeroSerie, setNumeroSerie] = useState<string>('');
  const [fabricante, setFabricante] = useState<string>('');
  const [proprietario, setProprietario] = useState<string>('');
  const [locatario, setLocatario] = useState<string>('');
  const [horimetro, setHorimetro] = useState<string>('');
  const [data, setData] = useState<string>(new Date().toLocaleDateString('pt-BR'));
  const [hora, setHora] = useState<string>(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [tipoInspecao, setTipoInspecao] = useState<'PRE_USO' | 'PERIODICA' | 'PREVENTIVA' | 'POS_MANUTENCAO'>('PRE_USO');
  const [inspetorNome, setInspetorNome] = useState<string>(profile?.nome || user?.name || '');
  const [inspetorCrea, setInspetorCrea] = useState<string>(profile?.crea || '');

  // Modal de Nova Plataforma
  const [showNewPlatformModal, setShowNewPlatformModal] = useState<boolean>(false);
  const [newPlatformModelo, setNewPlatformModelo] = useState<string>('');
  const [newPlatformSerie, setNewPlatformSerie] = useState<string>('');
  const [newPlatformProprietario, setNewPlatformProprietario] = useState<string>('');

  // Itens de Inspeção Agrupados (38 itens)
  const [categories, setCategories] = useState<InspectionCategory[]>(() => createInitialInspectionCategories());
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState<number>(0);
  const [expandedObservations, setExpandedObservations] = useState<Record<string, boolean>>({});

  // Fotos, Assinatura e Justificativa
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState<string>('');

  // Estado de Salvamento
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [completedInspection, setCompletedInspection] = useState<Inspection | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      getPlatforms(companyId).then((list) => {
        setPlatforms(list);
        if (list.length > 0 && !selectedPlatformId) {
          const first = list[0];
          setSelectedPlatformId(first.id);
          setModelo(first.modelo);
          setNumeroSerie(first.numeroSerie);
          setProprietario(first.proprietario || companyName || '');
          setLocatario(first.locatario || '');
        }
      });
    }
  }, [companyId, companyName]);

  useEffect(() => {
    if (profile?.nome && !inspetorNome) {
      setInspetorNome(profile.nome);
    }
    if (profile?.crea && !inspetorCrea) {
      setInspetorCrea(profile.crea);
    }
    if (companyName && !proprietario) {
      setProprietario(companyName);
    }
  }, [profile, companyName]);

  const handlePlatformSelect = (platId: string) => {
    setSelectedPlatformId(platId);
    if (platId === 'NEW') {
      setShowNewPlatformModal(true);
      return;
    }
    const found = platforms.find((p) => p.id === platId);
    if (found) {
      setModelo(found.modelo);
      setNumeroSerie(found.numeroSerie);
      setProprietario(found.proprietario || companyName || '');
      setLocatario(found.locatario || '');
    }
  };

  const handleCreateNewPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformModelo.trim() || !newPlatformSerie.trim()) {
      alert('Preencha Modelo e Número de Série.');
      return;
    }
    const created = await savePlatform({
      id: crypto.randomUUID(),
      empresaId: companyId || 'default_company',
      modelo: newPlatformModelo.trim(),
      numeroSerie: newPlatformSerie.trim(),
      proprietario: newPlatformProprietario.trim() || companyName || 'Empresa'
    });
    setPlatforms((prev) => [...prev, created]);
    setSelectedPlatformId(created.id);
    setModelo(created.modelo);
    setNumeroSerie(created.numeroSerie);
    setProprietario(created.proprietario);
    setShowNewPlatformModal(false);
    setNewPlatformModelo('');
    setNewPlatformSerie('');
    setNewPlatformProprietario('');
  };

  const handleItemStatusChange = (catIdx: number, itemIdx: number, status: InspectionItemStatus) => {
    setCategories((prev) => {
      const copy = [...prev];
      const category = { ...copy[catIdx] };
      const items = [...category.itens];
      items[itemIdx] = { ...items[itemIdx], status };
      category.itens = items;
      copy[catIdx] = category;
      return copy;
    });

    if (status === 'NAO_CONFORME') {
      const itemId = categories[catIdx]?.itens[itemIdx]?.id;
      if (itemId) {
        setExpandedObservations((prev) => ({ ...prev, [itemId]: true }));
      }
    }
  };

  const handleItemObservationChange = (catIdx: number, itemIdx: number, observation: string) => {
    setCategories((prev) => {
      const copy = [...prev];
      const category = { ...copy[catIdx] };
      const items = [...category.itens];
      items[itemIdx] = { ...items[itemIdx], observacao: observation };
      category.itens = items;
      copy[catIdx] = category;
      return copy;
    });
  };

  const handleMarkCategoryAllConforme = (catIdx: number) => {
    setCategories((prev) => {
      const copy = [...prev];
      const category = { ...copy[catIdx] };
      category.itens = category.itens.map((it) => ({
        ...it,
        status: 'CONFORME'
      }));
      copy[catIdx] = category;
      return copy;
    });
  };

  const handleMarkAll38ItemsConforme = () => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        itens: cat.itens.map((it) => ({
          ...it,
          status: 'CONFORME'
        }))
      }))
    );
  };

  const handleToggleObservation = (itemId: string) => {
    setExpandedObservations((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Cálculo sequencial do índice global (01 a 38)
  const getGlobalItemIndex = (targetCatIdx: number, targetItemIdx: number) => {
    let index = 1;
    for (let c = 0; c < categories.length; c++) {
      if (c < targetCatIdx) {
        index += categories[c].itens.length;
      } else if (c === targetCatIdx) {
        index += targetItemIdx;
        break;
      }
    }
    return index;
  };

  const stats = analyzeInspectionApproval(categories);
  const isApproved = stats.status === 'APROVADA';
  const totalItemsCount = stats.total;
  const evaluatedItemsCount = totalItemsCount - stats.pendentes;
  const progressPercentage = Math.round((evaluatedItemsCount / totalItemsCount) * 100);

  const canAdvanceFromStep1 = Boolean(
    modelo.trim() && numeroSerie.trim() && data.trim() && inspetorNome.trim()
  );

  const handleSaveInspection = async () => {
    if (!signatureBase64) {
      setErrorMessage('A assinatura digital do inspetor é obrigatória para emissão do laudo.');
      return;
    }

    if (!isApproved && !justificativa.trim()) {
      setErrorMessage('Informe a justificativa técnica para os itens NÃO CONFORMES detectados.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const inspectionId = crypto.randomUUID();

    const inspectionData: Inspection = {
      id: inspectionId,
      empresaId: companyId || 'default_company',
      empresaNome: companyName || 'Empresa',
      usuarioId: user?.uid || '',
      inspetorNome: inspetorNome.trim(),
      inspetorCrea: inspetorCrea.trim() || undefined,
      plataformaId: selectedPlatformId || 'PEMT_DEFAULT',
      modelo: modelo.trim(),
      numeroSerie: numeroSerie.trim(),
      proprietario: proprietario.trim() || companyName || '',
      locatario: locatario.trim() || undefined,
      data: data.trim(),
      hora: hora.trim(),
      horimetro: horimetro.trim() || '0',
      tipoInspecao,
      statusFinal: stats.status,
      justificativa: justificativa.trim() || null,
      assinaturaRemoteUrl: signatureBase64,
      timestamp: Date.now(),
      syncStatus: 'SYNCED',
      totalItens: stats.total,
      itensConformes: stats.conformes,
      itensNaoConformes: stats.naoConformes,
      itensNA: stats.na
    };

    try {
      const saved = await saveInspectionToFirestore({
        inspection: inspectionData,
        categories,
        photos,
        signatureBase64
      });

      setCompletedInspection(saved);
      setStep(5);
    } catch (err: any) {
      console.error('Erro ao salvar inspeção:', err);
      setErrorMessage(`Erro ao salvar inspeção: ${err?.message || 'Falha na conexão'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!completedInspection) return;
    const flattenedItems = categories.flatMap((c) =>
      c.itens.map((it) => ({
        id: it.id,
        inspecaoId: completedInspection.id,
        categoria: c.nome,
        descricao: it.nome,
        status: it.status,
        observacao: it.observacao || null
      }))
    );

    downloadInspectionPdf({
      inspection: completedInspection,
      itens: flattenedItems,
      fotos: photos,
      company: {
        id: companyId || '',
        empresaId: companyId || '',
        nome: companyName || 'Empresa',
        cnpj: profile?.cpf || ''
      }
    });
  };

  const handleResetForNewInspection = () => {
    setStep(1);
    setCategories(createInitialInspectionCategories());
    setPhotos([]);
    setSignatureBase64(null);
    setJustificativa('');
    setCompletedInspection(null);
    setErrorMessage(null);
    setHorimetro('');
  };

  return (
    <div className="page-container" style={{ maxWidth: '1080px' }}>
      {/* 1. CABEÇALHO PRINCIPAL DA INSPEÇÃO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Nova Inspeção
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
            PEMT · Checklist de Inspeção
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', minWidth: '180px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <span style={{ color: '#38bdf8' }}>{evaluatedItemsCount}</span> / {totalItemsCount} itens
          </div>
          <div
            style={{
              width: '180px',
              height: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div
              style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: progressPercentage === 100 ? '#10b981' : 'var(--primary)',
                transition: 'width 0.2s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. STEPPER EM 5 ETAPAS */}
      <InspectionStepper
        currentStep={step}
        steps={STEPS}
        onStepClick={(s) => setStep(s as Step)}
        maxAccessibleStep={completedInspection ? 5 : 4}
      />

      {/* Mensagem de Erro / Alerta */}
      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--danger-subtle)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ETAPA 1: EQUIPAMENTO */}
      {step === 1 && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Seção: Identificação da PEMT */}
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <ShieldCheck size={18} color="var(--primary)" />
                <span>Identificação da PEMT</span>
              </div>
              {platforms.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ margin: 0, fontSize: '0.75rem' }}>Equipamento salvo:</label>
                  <select
                    value={selectedPlatformId}
                    onChange={(e) => handlePlatformSelect(e.target.value)}
                    style={{ width: 'auto', minWidth: '180px', padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    <option value="">-- Selecionar da frota --</option>
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.modelo} (S/N: {p.numeroSerie})
                      </option>
                    ))}
                    <option value="NEW">+ Cadastrar Novo Equipamento</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid-2">
              <div>
                <label>Modelo do Equipamento *</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: Genie Z-45/25J, JLG 600AJ"
                  required
                />
              </div>

              <div>
                <label>Número de Série / Tag *</label>
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  placeholder="Ex: Z4525D-12345"
                  required
                />
              </div>

              <div>
                <label>Fabricante</label>
                <input
                  type="text"
                  value={fabricante}
                  onChange={(e) => setFabricante(e.target.value)}
                  placeholder="Ex: Genie, JLG, Haulotte, Skyjack"
                />
              </div>

              <div>
                <label>Horímetro Atual (h)</label>
                <input
                  type="number"
                  step="0.1"
                  value={horimetro}
                  onChange={(e) => setHorimetro(e.target.value)}
                  placeholder="Ex: 1450.5"
                />
              </div>
            </div>
          </div>

          {/* Seção: Responsabilidade */}
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <Building2 size={18} color="var(--primary)" />
                <span>Responsabilidade & Local</span>
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label>Proprietário / Locadora</label>
                <input
                  type="text"
                  value={proprietario}
                  onChange={(e) => setProprietario(e.target.value)}
                  placeholder="Nome da Empresa Proprietária"
                />
              </div>

              <div>
                <label>Locatário / Obra / Frente de Trabalho</label>
                <input
                  type="text"
                  value={locatario}
                  onChange={(e) => setLocatario(e.target.value)}
                  placeholder="Ex: Construtora Alpha / Galpão 02"
                />
              </div>
            </div>
          </div>

          {/* Seção: Tipo de Inspeção & Inspetor */}
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <Calendar size={18} color="var(--primary)" />
                <span>Tipo de Inspeção & Inspetor</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label>Tipo de Inspeção *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'PRE_USO', label: 'Pré-Uso (Diária)' },
                    { id: 'PERIODICA', label: 'Periódica' },
                    { id: 'PREVENTIVA', label: 'Preventiva' },
                    { id: 'POS_MANUTENCAO', label: 'Pós-Manutenção' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipoInspecao(t.id as any)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: tipoInspecao === t.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        background: tipoInspecao === t.id ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                        color: tipoInspecao === t.id ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label>Data da Inspeção *</label>
                  <input
                    type="text"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    required
                  />
                </div>

                <div>
                  <label>Hora</label>
                  <input
                    type="text"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    placeholder="HH:mm"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label>Inspetor Técnico Habilitado *</label>
                  <input
                    type="text"
                    value={inspetorNome}
                    onChange={(e) => setInspetorNome(e.target.value)}
                    placeholder="Nome completo do inspetor"
                    required
                  />
                </div>

                <div>
                  <label>Registro CREA / CFT</label>
                  <input
                    type="text"
                    value={inspetorCrea}
                    onChange={(e) => setInspetorCrea(e.target.value)}
                    placeholder="Ex: CREA 123456/D"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              className="btn-primary"
              disabled={!canAdvanceFromStep1}
              onClick={() => {
                setErrorMessage(null);
                setStep(2);
              }}
              style={{ minWidth: '180px', padding: '12px 20px' }}
            >
              <span>Avançar para o Checklist</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 2: CHECKLIST (38 ITENS) */}
      {step === 2 && (
        <div>
          {/* Topo da Tela do Checklist - Resumo do Equipamento */}
          <div
            className="ind-card"
            style={{
              padding: '14px 18px',
              marginBottom: '16px',
              borderLeft: '4px solid var(--industrial-amber)',
              background: '#090e18'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span className="badge badge-warning">EM AUDITORIA</span>
                  <span style={{ fontFamily: 'monospace' }}>S/N: {numeroSerie || 'NÃO INFORMADO'}</span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {modelo || 'Equipamento PEMT'}
                </div>
              </div>

              {/* Botão de Preenchimento Rápido em Massa */}
              <button
                type="button"
                onClick={handleMarkAll38ItemsConforme}
                className="btn-success"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.78rem',
                  letterSpacing: '0.04em',
                  fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                }}
                title="Marca todos os 38 itens como Conforme (OK). Você pode depois alterar apenas os itens com defeito."
              >
                <Check size={16} strokeWidth={3} />
                <span>APROVAR TODOS OS 38 ITENS (OK)</span>
              </button>
            </div>
          </div>

          {/* Barra de Status e Contagem */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              padding: '8px 4px',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              38 ITENS NORMATIVOS (NR-18 / NR-35)
            </div>

            {/* Resumo de Status Industrial */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge badge-approved" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                CONFORMES: {stats.conformes}
              </span>

              <span className="badge badge-rejected" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                NÃO CONFORMES: {stats.naoConformes}
              </span>

              <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                N/A: {stats.na}
              </span>

              {stats.pendentes > 0 && (
                <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                  PENDENTES: {stats.pendentes}
                </span>
              )}
            </div>
          </div>

          {/* Navegação de Categorias */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {categories.map((cat, idx) => (
              <button
                key={cat.nome}
                onClick={() => setCurrentCategoryIdx(idx)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: idx === currentCategoryIdx ? 800 : 600,
                  background: idx === currentCategoryIdx ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                  color: idx === currentCategoryIdx ? '#ffffff' : 'var(--text-secondary)',
                  border: idx === currentCategoryIdx ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.nome}
              </button>
            ))}
          </div>

          {/* Categoria Ativa */}
          <ChecklistCategorySection
            category={categories[currentCategoryIdx]}
            categoryIndex={currentCategoryIdx}
            isOpen={true}
            onToggleOpen={() => {}}
            onItemStatusChange={handleItemStatusChange}
            onItemObservacaoChange={handleItemObservationChange}
            onMarkAllConforme={handleMarkCategoryAllConforme}
            expandedObservations={expandedObservations}
            onToggleObservation={handleToggleObservation}
            getGlobalItemIndex={getGlobalItemIndex}
          />

          {/* Navegação Inferior */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep(1)}
              style={{ padding: '10px 18px' }}
            >
              <ChevronLeft size={16} />
              <span>← Voltar</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/history" className="btn-secondary" style={{ padding: '10px 16px' }}>
                Salvar e sair
              </Link>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(3);
                }}
                style={{ padding: '10px 22px' }}
              >
                <span>Continuar →</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 3: EVIDÊNCIAS FOTOGRÁFICAS */}
      {step === 3 && (
        <div>
          <PhotoUploader
            photos={photos}
            onChange={(newPhotos) => setPhotos(newPhotos)}
            maxPhotos={12}
          />

          {/* Navegação Inferior */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '32px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep(2)}
              style={{ padding: '10px 18px' }}
            >
              <ChevronLeft size={16} />
              <span>← Voltar para Checklist</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setErrorMessage(null);
                setStep(4);
              }}
              style={{ padding: '10px 22px' }}
            >
              <span>Avançar para Parecer →</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 4: PARECER & ASSINATURA */}
      {step === 4 && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* 1. Resultado da Inspeção (Grande) */}
          <div
            className="ind-card"
            style={{
              padding: '24px',
              textAlign: 'center',
              border: `2px solid ${isApproved ? 'var(--success-border)' : 'var(--danger-border)'}`,
              background: isApproved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
            }}
          >
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Resultado da Inspeção
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: isApproved ? '#4ade80' : '#f87171',
                letterSpacing: '0.03em'
              }}
            >
              {isApproved ? 'APROVADA' : 'NÃO APROVADA'}
            </div>

            {/* 2. Resumo */}
            <div
              style={{
                display: 'inline-flex',
                gap: '16px',
                marginTop: '16px',
                padding: '8px 18px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem'
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>38 itens avaliados:</span>
              <strong style={{ color: '#4ade80' }}>{stats.conformes} conformes</strong>
              <strong style={{ color: '#f87171' }}>{stats.naoConformes} não conformes</strong>
              <strong style={{ color: '#cbd5e1' }}>{stats.na} N/A</strong>
            </div>
          </div>

          {/* 3. Justificativa Técnica (Se houver não conformidade) */}
          {!isApproved && (
            <div className="ind-card" style={{ border: '1px solid var(--danger-border)' }}>
              <div className="ind-card-header">
                <div className="ind-card-title" style={{ color: '#f87171' }}>
                  <AlertTriangle size={18} color="#f87171" />
                  <span>Justificativa Técnica de Não Conformidade *</span>
                </div>
                <span className="badge badge-danger">Bloqueio Operacional</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                Descreva os riscos detectados, as não conformidades observadas e as recomendações de manutenção corretiva.
              </p>
              <textarea
                rows={4}
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Ex: Identificado vazamento severo de fluido hidráulico no cilindro de elevação e cabo de emergência rompido. Equipamento interditado para manutenção..."
                required
              />
            </div>
          )}

          {/* 4. Assinatura do Inspetor */}
          <div className="ind-card">
            <div className="ind-card-header">
              <div className="ind-card-title">
                <User size={18} color="var(--primary)" />
                <span>Assinatura do Inspetor Técnico *</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {inspetorNome} {inspetorCrea ? `(${inspetorCrea})` : ''}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Ao assinar digitalmente, o responsável técnico certifica a veracidade das informações registradas no checklist conforme as normas NR-18 e NR-35.
            </p>

            <SignatureCanvas
              initialValue={signatureBase64}
              onSave={(base64) => setSignatureBase64(base64)}
              onClear={() => setSignatureBase64(null)}
              height={180}
            />
          </div>

          {/* Navegação e Ação de Finalizar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep(3)}
              disabled={isSaving}
              style={{ padding: '10px 18px' }}
            >
              <ChevronLeft size={16} />
              <span>← Voltar</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveInspection}
              disabled={isSaving || !signatureBase64 || (!isApproved && !justificativa.trim())}
              style={{ padding: '12px 24px', minWidth: '200px' }}
            >
              {isSaving ? (
                <span>Gravando Laudo...</span>
              ) : (
                <>
                  <Check size={18} />
                  <span>Emitir e Finalizar Laudo</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 5: FINALIZAÇÃO & DOWNLOAD */}
      {step === 5 && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Topo Conclusão */}
          <div
            className="ind-card"
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              border: '1px solid var(--success-border)',
              background: 'rgba(16, 185, 129, 0.05)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Check size={32} strokeWidth={3} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Inspeção pronta
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Revise os dados antes de gerar o laudo.
            </p>
          </div>

          {/* Resumo Organizado */}
          <div className="grid-2">
            {/* EQUIPAMENTO */}
            <div className="ind-card">
              <div className="ind-card-header">
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  EQUIPAMENTO
                </span>
              </div>
              <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Modelo:</span>
                  <strong>{modelo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Número de Série:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{numeroSerie}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Horímetro:</span>
                  <strong>{horimetro || '0'} h</strong>
                </div>
              </div>
            </div>

            {/* INSPEÇÃO */}
            <div className="ind-card">
              <div className="ind-card-header">
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  INSPEÇÃO
                </span>
              </div>
              <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tipo:</span>
                  <strong>{tipoInspecao}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Data:</span>
                  <strong>{data} às {hora}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Inspetor:</span>
                  <strong>{inspetorNome}</strong>
                </div>
              </div>
            </div>

            {/* RESULTADO */}
            <div className="ind-card">
              <div className="ind-card-header">
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  RESULTADO
                </span>
              </div>
              <div>
                <span className={`badge ${isApproved ? 'badge-approved' : 'badge-rejected'}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  {isApproved ? '✓ APROVADA' : '✕ NÃO APROVADA'}
                </span>
                {justificativa && (
                  <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#fca5a5' }}>
                    Obs: {justificativa}
                  </p>
                )}
              </div>
            </div>

            {/* RESUMO DO CHECKLIST */}
            <div className="ind-card">
              <div className="ind-card-header">
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  RESUMO DO CHECKLIST
                </span>
              </div>
              <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Conformes:</span>
                  <strong style={{ color: '#4ade80' }}>{stats.conformes}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Não conformes:</span>
                  <strong style={{ color: '#f87171' }}>{stats.naoConformes}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>N/A:</span>
                  <strong style={{ color: '#cbd5e1' }}>{stats.na}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Gerar Laudo Técnico em PDF */}
          <div
            className="ind-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'center'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Gerar Laudo Técnico em PDF
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Documento técnico homologado em conformidade com as normas regulamentadoras
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleDownloadPdf}
              style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: 800 }}
            >
              <FileDown size={20} />
              <span>GERAR PDF</span>
            </button>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <Link to="/history" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <History size={15} />
                <span>Ver no Histórico</span>
              </Link>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleResetForNewInspection}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <Plus size={15} />
                <span>Nova Inspeção</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Nova Plataforma */}
      {showNewPlatformModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
          onClick={() => setShowNewPlatformModal(false)}
        >
          <div
            className="ind-card"
            style={{ width: 'min(500px, 100%)', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ind-card-header">
              <div className="ind-card-title">
                <ShieldCheck size={18} color="var(--primary)" />
                <span>Cadastrar Novo Equipamento</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPlatformModal(false)}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewPlatform} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label>Modelo da PEMT *</label>
                <input
                  type="text"
                  value={newPlatformModelo}
                  onChange={(e) => setNewPlatformModelo(e.target.value)}
                  placeholder="Ex: Genie Z-45/25J"
                  required
                />
              </div>

              <div>
                <label>Número de Série *</label>
                <input
                  type="text"
                  value={newPlatformSerie}
                  onChange={(e) => setNewPlatformSerie(e.target.value)}
                  placeholder="Ex: Z4525D-99887"
                  required
                />
              </div>

              <div>
                <label>Proprietário</label>
                <input
                  type="text"
                  value={newPlatformProprietario}
                  onChange={(e) => setNewPlatformProprietario(e.target.value)}
                  placeholder={companyName || 'Nome da empresa'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewPlatformModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
