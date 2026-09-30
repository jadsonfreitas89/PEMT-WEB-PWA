import { useState, useEffect, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Percent,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  FileDown
} from 'lucide-react';
import { useAuth } from '../services/auth/AuthContext';
import { getInspections, getInspectionDetails } from '../firebase/firebaseInspection';
import { downloadInspectionPdf } from '../utils/pdfGenerator';
import type { Inspection } from '../types/inspection';

export default function HomePage() {
  const { profile, user, companyId, companyName } = useAuth();
  const displayName = profile?.nome || user?.name || user?.email?.split('@')[0] || 'Inspetor Técnico';
  const displayCrea = profile?.crea || 'Habilitado NR-18/35';

  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (companyId) {
      getInspections(companyId)
        .then((list) => {
          setRecentInspections(list);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [companyId]);

  const total = recentInspections.length;
  const aprovadas = recentInspections.filter((i) => i.statusFinal === 'APROVADA').length;
  const reprovadas = recentInspections.filter((i) => i.statusFinal !== 'APROVADA').length;
  const taxaConformidade = total > 0 ? Math.round((aprovadas / total) * 100) : 100;

  const handleQuickDownloadPdf = async (inspecao: Inspection, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const details = await getInspectionDetails(inspecao.id);
      downloadInspectionPdf({
        inspection: inspecao,
        itens: details.itens,
        fotos: details.fotos,
        company: {
          id: companyId || '',
          empresaId: companyId || '',
          nome: companyName || 'Empresa',
          cnpj: profile?.cpf || ''
        }
      });
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
    }
  };

  return (
    <div className="page-container">
      {/* Industrial Machine Header Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-warning">NR-18 / NR-35</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              PEMT SISTEMA INDUSTRIAL
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Painel Operacional de Inspeções
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="var(--industrial-amber)" />
              <strong>{displayName}</strong> {profile?.crea ? `(${profile.crea})` : ''}
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={15} color="var(--text-muted)" />
              <span>{companyName || profile?.empresaNome || 'Empresa'}</span>
            </span>
          </div>
        </div>

        <div>
          <Link
            to="/checklist"
            className="btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.9rem', letterSpacing: '0.04em' }}
          >
            <Plus size={20} strokeWidth={3} />
            <span>NOVA INSPEÇÃO (38 ITENS)</span>
          </Link>
        </div>
      </div>

      {/* 4 Robust Industrial Metric Blocks */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="ind-card" style={{ borderLeft: '4px solid var(--border-strong)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              TOTAL DE LAUDOS
            </span>
            <FileText size={16} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
            {total.toString().padStart(2, '0')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Inspeções registradas
          </div>
        </div>

        <div className="ind-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              LIBERADAS / CONFORMES
            </span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4ade80', fontFamily: 'monospace' }}>
            {aprovadas.toString().padStart(2, '0')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Aptas para operação
          </div>
        </div>

        <div className="ind-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              BLOQUEADAS / COM AVARIAS
            </span>
            <AlertTriangle size={16} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f87171', fontFamily: 'monospace' }}>
            {reprovadas.toString().padStart(2, '0')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Exigem manutenção
          </div>
        </div>

        <div className="ind-card" style={{ borderLeft: '4px solid var(--industrial-amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ÍNDICE DE CONFORMIDADE
            </span>
            <Percent size={16} color="var(--industrial-amber)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>
            {taxaConformidade}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Média da frota
          </div>
        </div>
      </div>

      {/* Tabela de Inspeções Recentes */}
      <div className="ind-card">
        <div className="ind-card-header">
          <div className="ind-card-title">
            <Clock size={18} color="var(--industrial-amber)" />
            <span>ÚLTIMAS INSPEÇÕES REGISTRADAS</span>
          </div>
          <Link
            to="/history"
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#38bdf8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}
          >
            Ver histórico completo ({total})
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            [ CARREGANDO REGISTROS DE INSPEÇÃO... ]
          </div>
        ) : recentInspections.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--industrial-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <FileText size={26} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Nenhuma inspeção de PEMT realizada
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px', maxWidth: '380px', margin: '0 auto 18px' }}>
              Inicie a inspeção técnica de 38 itens normativos (NR-18 / NR-35) com registro de fotos e assinatura.
            </p>
            <Link to="/checklist" className="btn-primary">
              <Plus size={16} />
              <span>INICIAR PRIMEIRA INSPEÇÃO</span>
            </Link>
          </div>
        ) : (
          <div className="ind-table-container">
            <table className="ind-table">
              <thead>
                <tr>
                  <th>DATA / HORA</th>
                  <th>EQUIPAMENTO / MODELO</th>
                  <th>Nº DE SÉRIE</th>
                  <th>TIPO</th>
                  <th>HORÍMETRO</th>
                  <th>PARECER TÉCNICO</th>
                  <th style={{ textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {recentInspections.slice(0, 6).map((inspecao) => {
                  const isAprovada = inspecao.statusFinal === 'APROVADA';
                  return (
                    <tr key={inspecao.id}>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        {inspecao.data} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{inspecao.hora}</span>
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                        {inspecao.modelo}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#38bdf8' }}>
                        {inspecao.numeroSerie}
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {inspecao.tipoInspecao === 'PRE_USO' ? 'Pré-Uso' :
                           inspecao.tipoInspecao === 'PERIODICA' ? 'Periódica' :
                           inspecao.tipoInspecao === 'PREVENTIVA' ? 'Preventiva' : 'Pós-Manutenção'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {inspecao.horimetro ? `${inspecao.horimetro} h` : '—'}
                      </td>
                      <td>
                        <span className={`badge ${isAprovada ? 'badge-approved' : 'badge-rejected'}`}>
                          {isAprovada ? '✓ LIBERADA (OK)' : '✕ BLOQUEADA (NC)'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => handleQuickDownloadPdf(inspecao, e)}
                            className="btn-secondary"
                            title="Baixar Laudo Técnico em PDF"
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.75rem',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            <FileDown size={14} color="var(--industrial-amber)" />
                            <span>PDF</span>
                          </button>
                          <Link
                            to="/history"
                            className="btn-secondary"
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.75rem',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            <span>Detalhes</span>
                            <ChevronRight size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

