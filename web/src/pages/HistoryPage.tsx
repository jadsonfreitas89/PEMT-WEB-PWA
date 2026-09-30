import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  FileDown,
  Printer,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Plus,
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import {
  getInspections,
  getInspectionDetails,
  deleteInspection
} from '../firebase/firebaseInspection';
import { downloadInspectionPdf } from '../utils/pdfGenerator';
import type {
  Inspection,
  InspectionItem,
  InspectionPhoto
} from '../types/inspection';

export default function HistoryPage() {
  const { companyId, companyName, profile } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APROVADA' | 'REPROVADA'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal de Detalhes
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [modalItems, setModalItems] = useState<InspectionItem[]>([]);
  const [modalPhotos, setModalPhotos] = useState<InspectionPhoto[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getInspections(companyId || '');
      setInspections(data);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [companyId]);

  const handleOpenDetails = async (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setLoadingDetails(true);
    try {
      const details = await getInspectionDetails(inspection.id);
      setModalItems(details.itens);
      setModalPhotos(details.fotos);
    } catch (err) {
      console.error('Erro ao buscar detalhes da inspeção:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDownloadPdf = (inspection: Inspection, items: InspectionItem[], photos: InspectionPhoto[]) => {
    downloadInspectionPdf({
      inspection,
      itens: items.length > 0 ? items : [
        {
          id: '1',
          inspecaoId: inspection.id,
          categoria: 'INSPEÇÃO GERAL',
          descricao: `Inspeção realizada em ${inspection.data}`,
          status: inspection.statusFinal === 'APROVADA' ? 'CONFORME' : 'NAO_CONFORME'
        }
      ],
      fotos: photos,
      company: {
        id: companyId || '',
        empresaId: companyId || '',
        nome: companyName || 'Empresa',
        cnpj: profile?.cpf || ''
      }
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Confirma a exclusão deste laudo de inspeção? Esta ação não pode ser desfeita.')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteInspection(id);
      setInspections((prev) => prev.filter((i) => i.id !== id));
      if (selectedInspection?.id === id) {
        setSelectedInspection(null);
      }
    } catch (err) {
      console.error('Erro ao excluir inspeção:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredInspections = inspections.filter((item) => {
    const matchesSearch =
      (item.modelo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.numeroSerie || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.inspetorNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.data || '').includes(searchTerm);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'APROVADA' && item.statusFinal === 'APROVADA') ||
      (statusFilter === 'REPROVADA' && item.statusFinal !== 'APROVADA');

    const matchesType =
      typeFilter === 'ALL' || item.tipoInspecao === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="page-container">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-warning">RASTREABILIDADE</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              NR-18 / NR-35
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Histórico de Inspeções Técnicas
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchHistory}
            disabled={loading}
            style={{ padding: '8px 14px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>

          <Link to="/checklist" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            <Plus size={16} strokeWidth={3} />
            <span>NOVA INSPEÇÃO</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="ind-card"
        style={{
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#090e18'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px' }}>
          <Search size={16} color="var(--industrial-amber)" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por modelo, série, inspetor ou data..."
            style={{ padding: '8px 12px', fontSize: '0.85rem', background: '#05080f' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ width: 'auto', minWidth: '150px', padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            <option value="ALL">Status: Todos</option>
            <option value="APROVADA">✓ Liberadas / Conformes</option>
            <option value="REPROVADA">✕ Bloqueadas / Defeito</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '150px', padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            <option value="ALL">Tipo: Todos</option>
            <option value="PRE_USO">Pré-Uso (Diária)</option>
            <option value="PERIODICA">Periódica</option>
            <option value="PREVENTIVA">Preventiva</option>
            <option value="POS_MANUTENCAO">Pós-Manutenção</option>
          </select>
        </div>
      </div>

      {/* Industrial Table (Desktop) / Cards (Mobile) */}
      {loading ? (
        <div className="ind-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando histórico do servidor...
        </div>
      ) : filteredInspections.length === 0 ? (
        <div className="ind-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <FileText size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Nenhum laudo encontrado
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Tente alterar os filtros de busca para encontrar registros.'
              : 'Nenhuma inspeção foi registrada para esta empresa até o momento.'}
          </p>
        </div>
      ) : (
        <div className="ind-table-container">
          <table className="ind-table">
            <thead>
              <tr>
                <th>DATA / HORA</th>
                <th>EQUIPAMENTO / MODELO</th>
                <th>Nº SÉRIE</th>
                <th>TIPO</th>
                <th>INSPETOR</th>
                <th>PARECER TÉCNICO</th>
                <th style={{ textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filteredInspections.map((inspecao) => {
                const isAprovada = inspecao.statusFinal === 'APROVADA';
                return (
                  <tr key={inspecao.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetails(inspecao)}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 700, fontFamily: 'monospace' }}>
                      {inspecao.data}{' '}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{inspecao.hora}</span>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{inspecao.modelo}</td>
                    <td style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.85rem' }}>
                      {inspecao.numeroSerie}
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {inspecao.tipoInspecao === 'PRE_USO' ? 'Pré-Uso' :
                         inspecao.tipoInspecao === 'PERIODICA' ? 'Periódica' :
                         inspecao.tipoInspecao === 'PREVENTIVA' ? 'Preventiva' : 'Pós-Manutenção'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{inspecao.inspetorNome}</td>
                    <td>
                      <span className={`badge ${isAprovada ? 'badge-approved' : 'badge-rejected'}`}>
                        {isAprovada ? '✓ LIBERADA' : '✕ BLOQUEADA'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleOpenDetails(inspecao)}
                          style={{ padding: '5px 9px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                          title="Ver Detalhes do Laudo"
                        >
                          <Eye size={13} />
                          <span>Ver</span>
                        </button>

                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleDownloadPdf(inspecao, [], [])}
                          style={{ padding: '5px 9px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', color: '#fbbf24' }}
                          title="Baixar Laudo Técnico em PDF"
                        >
                          <FileDown size={13} color="var(--industrial-amber)" />
                          <span>PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(inspecao.id, e)}
                          disabled={deletingId === inspecao.id}
                          style={{
                            background: 'transparent',
                            color: '#f87171',
                            padding: '5px 7px',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          title="Excluir Registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalhes da Inspeção */}
      {selectedInspection && (
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
          onClick={() => setSelectedInspection(null)}
        >
          <div
            className="ind-card"
            style={{
              width: 'min(860px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className={`badge ${selectedInspection.statusFinal === 'APROVADA' ? 'badge-approved' : 'badge-rejected'}`}>
                    {selectedInspection.statusFinal === 'APROVADA' ? '✓ EQUIPAMENTO APROVADO' : '✕ NÃO APROVADO'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Laudo #{selectedInspection.id.substring(0, 8)}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedInspection.modelo} — Série: {selectedInspection.numeroSerie}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Informações Técnicas */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div className="grid-3" style={{ gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data & Hora</span>
                  <div style={{ fontWeight: 600 }}>{selectedInspection.data} às {selectedInspection.hora}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inspetor / CREA</span>
                  <div style={{ fontWeight: 600 }}>{selectedInspection.inspetorNome} {selectedInspection.inspetorCrea ? `(${selectedInspection.inspetorCrea})` : ''}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Horímetro</span>
                  <div style={{ fontWeight: 600 }}>{selectedInspection.horimetro || '0'} h</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Proprietário</span>
                  <div style={{ fontWeight: 600 }}>{selectedInspection.proprietario || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Locatário / Obra</span>
                  <div style={{ fontWeight: 600 }}>{selectedInspection.locatario || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tipo de Inspeção</span>
                  <div style={{ fontWeight: 600 }}>{selectedInspection.tipoInspecao}</div>
                </div>
              </div>
            </div>

            {selectedInspection.justificativa && (
              <div
                style={{
                  background: 'var(--danger-subtle)',
                  border: '1px solid var(--danger-border)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Justificativa Técnica de Não Conformidade:
                </div>
                <div style={{ fontSize: '0.875rem', color: '#fca5a5' }}>
                  {selectedInspection.justificativa}
                </div>
              </div>
            )}

            {/* Itens Auditados */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Itens Inspecionados ({modalItems.length > 0 ? modalItems.length : 38})
              </h3>
              {loadingDetails ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Carregando checklist detalhado...
                </div>
              ) : modalItems.length > 0 ? (
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <table className="ind-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Descrição</th>
                        <th>Status</th>
                        <th>Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalItems.map((it) => (
                        <tr key={it.id}>
                          <td style={{ fontFamily: 'monospace' }}>#{it.id}</td>
                          <td>{it.descricao}</td>
                          <td>
                            <span className={`badge ${it.status === 'CONFORME' ? 'badge-approved' : it.status === 'NAO_CONFORME' ? 'badge-rejected' : 'badge-neutral'}`}>
                              {it.status === 'CONFORME' ? 'OK' : it.status === 'NAO_CONFORME' ? 'NÃO CONF.' : 'N/A'}
                            </span>
                          </td>
                          <td style={{ color: it.observacao ? '#f87171' : 'var(--text-muted)' }}>
                            {it.observacao || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Os 38 itens foram registrados e estão salvos no laudo técnico.
                </div>
              )}
            </div>

            {/* Evidências Fotográficas */}
            {modalPhotos.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Evidências Fotográficas ({modalPhotos.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {modalPhotos.map((f, i) => (
                    <div key={f.id || i} style={{ height: '100px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img src={f.base64Data} alt="Evidência" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assinatura do Inspetor */}
            {selectedInspection.assinaturaRemoteUrl && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Assinatura do Inspetor:
                </h3>
                <div style={{ maxWidth: '240px', background: '#ffffff', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)' }}>
                  <img src={selectedInspection.assinaturaRemoteUrl} alt="Assinatura" referrerPolicy="no-referrer" style={{ width: '100%', display: 'block' }} />
                </div>
              </div>
            )}

            {/* Footer Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedInspection(null)}
              >
                Fechar
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => handleDownloadPdf(selectedInspection, modalItems, modalPhotos)}
              >
                <FileDown size={16} />
                <span>Baixar Laudo em PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
