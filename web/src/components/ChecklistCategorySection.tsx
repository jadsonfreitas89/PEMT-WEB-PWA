import React from 'react';
import { ChevronDown, ChevronUp, CheckCheck } from 'lucide-react';
import ChecklistItemCard from './ChecklistItemCard';
import type { InspectionCategory, InspectionItemStatus } from '../types/inspection';

interface ChecklistCategorySectionProps {
  key?: React.Key;
  category: InspectionCategory;
  categoryIndex: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  onItemStatusChange: (categoryIndex: number, itemIndex: number, status: InspectionItemStatus) => void;
  onItemObservacaoChange: (categoryIndex: number, itemIndex: number, observacao: string) => void;
  onMarkAllConforme: (categoryIndex: number) => void;
  expandedObservations: Record<string, boolean>;
  onToggleObservation: (itemId: string) => void;
  getGlobalItemIndex: (categoryIndex: number, itemIndex: number) => number;
}

export default function ChecklistCategorySection({
  category,
  categoryIndex,
  isOpen,
  onToggleOpen,
  onItemStatusChange,
  onItemObservacaoChange,
  onMarkAllConforme,
  expandedObservations,
  onToggleObservation,
  getGlobalItemIndex
}: ChecklistCategorySectionProps) {
  const totalItens = category.itens.length;
  const completedItens = category.itens.filter((it) => it.status !== 'NONE').length;
  const conformes = category.itens.filter((it) => it.status === 'CONFORME').length;
  const naoConformes = category.itens.filter((it) => it.status === 'NAO_CONFORME').length;
  const percentCompleted = totalItens > 0 ? Math.round((completedItens / totalItens) * 100) : 0;
  const isAllCompleted = completedItens === totalItens;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${
          naoConformes > 0
            ? 'rgba(220, 38, 38, 0.5)'
            : isAllCompleted
            ? 'var(--border-strong)'
            : 'var(--border-subtle)'
        }`,
        borderRadius: 'var(--radius-md)',
        marginBottom: '14px',
        overflow: 'hidden'
      }}
    >
      {/* Category Header */}
      <div
        onClick={onToggleOpen}
        style={{
          padding: '12px 16px',
          background: '#090e18',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 260px' }}>
          <div style={{ color: 'var(--industrial-amber)' }}>
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          <div>
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {category.nome}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
              <span>·</span>
              <span style={{ color: isAllCompleted ? '#4ade80' : 'var(--text-muted)' }}>
                {completedItens}/{totalItens} verificados
              </span>
              {naoConformes > 0 && (
                <span className="badge badge-danger" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                  {naoConformes} NÃO CONFORME{naoConformes > 1 ? 'S' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar + Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ width: '90px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                fontFamily: 'monospace'
              }}
            >
              <span>Progresso</span>
              <span>{percentCompleted}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                background: '#04070d',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${percentCompleted}%`,
                  height: '100%',
                  background: isAllCompleted ? '#16a34a' : 'var(--industrial-amber)',
                  transition: 'width 0.2s ease'
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllConforme(categoryIndex);
            }}
            style={{
              padding: '6px 10px',
              fontSize: '0.72rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontWeight: 700
            }}
            title="Marcar todos os itens desta categoria como Conforme (OK)"
          >
            <CheckCheck size={13} color="#4ade80" />
            <span>CATEGORIA OK</span>
          </button>
        </div>
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div style={{ padding: '12px 14px', background: 'var(--bg-surface)' }}>
          {category.itens.map((item, itemIdx) => {
            const globalIndex = getGlobalItemIndex(categoryIndex, itemIdx);
            return (
              <ChecklistItemCard
                key={item.id}
                itemIndex={globalIndex}
                itemId={item.id}
                descricao={item.nome}
                status={item.status}
                observacao={item.observacao}
                onStatusChange={(status) => onItemStatusChange(categoryIndex, itemIdx, status)}
                onObservacaoChange={(obs) => onItemObservacaoChange(categoryIndex, itemIdx, obs)}
                isObservationExpanded={Boolean(expandedObservations[item.id])}
                onToggleObservation={() => onToggleObservation(item.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

