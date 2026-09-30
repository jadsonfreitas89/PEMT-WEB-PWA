import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Trash2, CheckCircle2, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
  initialValue?: string | null;
  onSave: (base64: string) => void;
  onClear?: () => void;
  height?: number;
}

export default function SignatureCanvas({
  initialValue,
  onSave,
  onClear,
  height = 180
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(initialValue));
  const [history, setHistory] = useState<ImageData[]>([]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(rect.width);
    const displayHeight = height;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fundo branco limpo para conformidade de documentos e laudos
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Linha guia sutil para assinatura
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, displayHeight - 35);
    ctx.lineTo(displayWidth - 30, displayHeight - 35);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Caneta azul escuro para assinatura oficial
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;

    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        setHasSignature(true);
      };
      img.src = initialValue;
    }
  }, [height, initialValue]);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const saveStateToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), state]);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    const mouseEvent = e as React.MouseEvent | MouseEvent;
    return {
      x: mouseEvent.clientX - rect.left,
      y: mouseEvent.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveStateToHistory();
    const { x, y } = getCoordinates(e);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    exportSignature();
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    ctx.putImageData(previousState, 0, 0);
    exportSignature();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.width / dpr;
    const displayHeight = canvas.height / dpr;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, displayHeight - 35);
    ctx.lineTo(displayWidth - 30, displayHeight - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;

    setHasSignature(false);
    setHistory([]);
    if (onClear) onClear();
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL('image/png');
    onSave(base64);
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: hasSignature ? '2px solid var(--primary)' : '1px solid var(--border-strong)',
          backgroundColor: '#ffffff',
          touchAction: 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ display: 'block', cursor: 'crosshair' }}
        />

        {!hasSignature && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 500,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <PenTool size={16} />
            <span>Assine aqui com o dedo ou mouse</span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleUndo}
            disabled={history.length === 0}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <RotateCcw size={14} />
            <span>Desfazer</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleClear}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Trash2 size={14} />
            <span>Limpar</span>
          </button>
        </div>

        {hasSignature && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckCircle2 size={16} />
            <span>Assinatura capturada</span>
          </div>
        )}
      </div>
    </div>
  );
}
