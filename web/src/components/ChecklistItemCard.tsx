import React from 'react';
import { MessageSquare, AlertCircle, Check, X, Minus } from 'lucide-react';
import type { InspectionItemStatus } from '../types/inspection';

interface ChecklistItemCardProps {
  key?: React.Key;
  itemIndex: number;
  itemId: string;
  descricao: string;
  status: InspectionItemStatus;
  observacao?: string | null;
  onStatusChange: (status: InspectionItemStatus) => void;
  onObservacaoChange: (observacao: string) => void;
  isObservationExpanded: boolean;
  onToggleObservation: () => void;
}

export default function ChecklistItemCard({
  itemIndex,
  descricao,
  status,
  observacao,
  onStatusChange,
  onObservacaoChange,
  isObservationExpanded,
  onToggleObservation
}: ChecklistItemCardProps) {
  const isConforme = status === 'CONFORME';
  const isNaoConforme = status === 'NAO_CONFORME';
  const isNA = status === 'NA';
  const hasObservation = Boolean(observacao && observacao.trim().length > 0);

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        marginBottom: '6px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {itemIndex.toString().padStart(2, '0')}.
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{descricao}</span>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => onStatusChange('CONFORME')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: status === 'CONFORME' ? '#16a34a' : 'var(--bg-surface-elevated)',
              color: status === 'CONFORME' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('NAO_CONFORME')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: status === 'NAO_CONFORME' ? '#dc2626' : 'var(--bg-surface-elevated)',
              color: status === 'NAO_CONFORME' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            NC
          </button>
        </div>
      </div>
      
      {(status === 'NAO_CONFORME' || isObservationExpanded) && (
        <input
          type="text"
          value={observacao || ''}
          onChange={(e) => onObservacaoChange(e.target.value)}
          placeholder="Justificativa técnica..."
          style={{
            marginTop: '8px',
            padding: '6px 10px',
            fontSize: '0.8rem',
            background: '#090e18'
          }}
        />
      )}
    </div>
  );
}

