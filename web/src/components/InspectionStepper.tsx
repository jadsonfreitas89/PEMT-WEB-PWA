import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
  short: string;
}

interface InspectionStepperProps {
  currentStep: number;
  steps: StepItem[];
  onStepClick?: (stepId: number) => void;
  maxAccessibleStep?: number;
}

export default function InspectionStepper({
  currentStep,
  steps,
  onStepClick,
  maxAccessibleStep = 5
}: InspectionStepperProps) {
  return (
    <div
      style={{
        width: '100%',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        marginBottom: '24px'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
          gap: '8px',
          alignItems: 'center'
        }}
      >
        {steps.map((step) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isAccessible = step.id <= maxAccessibleStep;

          let borderColor = 'var(--border-subtle)';
          let bgColor = 'transparent';
          let textColor = 'var(--text-muted)';
          let numberBg = 'rgba(148, 163, 184, 0.15)';
          let numberColor = 'var(--text-secondary)';

          if (isCurrent) {
            borderColor = 'var(--primary)';
            bgColor = 'var(--primary-subtle)';
            textColor = '#ffffff';
            numberBg = 'var(--primary)';
            numberColor = '#ffffff';
          } else if (isCompleted) {
            borderColor = 'var(--success-border)';
            bgColor = 'rgba(16, 185, 129, 0.08)';
            textColor = 'var(--text-primary)';
            numberBg = 'var(--success)';
            numberColor = '#ffffff';
          }

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                if (isAccessible && onStepClick) {
                  onStepClick(step.id);
                }
              }}
              disabled={!isAccessible}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${borderColor}`,
                background: bgColor,
                color: textColor,
                cursor: isAccessible ? 'pointer' : 'not-allowed',
                opacity: !isAccessible ? 0.45 : 1,
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: numberBg,
                  color: numberColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : step.short}
              </div>

              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: isCurrent ? '#93c5fd' : isCompleted ? '#86efac' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontWeight: 600
                  }}
                >
                  Etapa {step.short}
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: isCurrent ? 700 : 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {step.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
