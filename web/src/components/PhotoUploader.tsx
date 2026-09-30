import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Eye, X, Image as ImageIcon, Plus } from 'lucide-react';
import type { InspectionPhoto } from '../types/inspection';

interface PhotoUploaderProps {
  photos: InspectionPhoto[];
  onChange: (photos: InspectionPhoto[]) => void;
  maxPhotos?: number;
}

const CATEGORY_FILTERS = [
  'Todos',
  'Frente',
  'Lateral',
  'Traseira',
  'Painel',
  'Avaria',
  'Outro'
];

export default function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 12
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('Todos');
  const [currentUploadCategory, setCurrentUploadCategory] = useState<string>('Geral');
  const [previewPhoto, setPreviewPhoto] = useState<InspectionPhoto | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 960;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.68);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (photos.length >= maxPhotos) {
      alert(`Limite máximo de ${maxPhotos} fotos atingido.`);
      return;
    }

    setIsCompressing(true);
    const newPhotos: InspectionPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      if (photos.length + newPhotos.length >= maxPhotos) break;
      const file = files[i];
      try {
        const base64Data = await compressImage(file);
        newPhotos.push({
          id: crypto.randomUUID(),
          inspecaoId: '',
          base64Data,
          tipo: currentUploadCategory,
          descricao: '',
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
      }
    }

    onChange([...photos, ...newPhotos]);
    setIsCompressing(false);
  };

  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const handleUpdateDescription = (id: string, descricao: string) => {
    onChange(
      photos.map((p) => (p.id === id ? { ...p, descricao } : p))
    );
  };

  const handleUpdateTipo = (id: string, tipo: string) => {
    onChange(
      photos.map((p) => (p.id === id ? { ...p, tipo } : p))
    );
  };

  const filteredPhotos = photos.filter((p) => {
    if (selectedFilter === 'Todos') return true;
    return (p.tipo || '').toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <div>
      {/* Header section */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Evidências fotográficas
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Registre evidências da condição do equipamento.
        </p>
      </div>

      {/* Upload Actions Banner */}
      <div
        className="ind-card"
        style={{
          padding: '18px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 260px' }}>
          <label style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>Categoria ao anexar:</label>
          <select
            value={currentUploadCategory}
            onChange={(e) => setCurrentUploadCategory(e.target.value)}
            style={{ width: 'auto', minWidth: '160px', padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="Geral">Geral</option>
            <option value="Frente">Frente</option>
            <option value="Lateral">Lateral</option>
            <option value="Traseira">Traseira</option>
            <option value="Painel">Painel</option>
            <option value="Avaria">Avaria</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <button
            type="button"
            className="btn-secondary"
            onClick={() => cameraInputRef.current?.click()}
            disabled={photos.length >= maxPhotos || isCompressing}
            style={{ padding: '10px 16px' }}
          >
            <Camera size={16} />
            <span>Tirar Foto</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= maxPhotos || isCompressing}
            style={{ padding: '10px 20px', fontSize: '0.95rem' }}
          >
            <Plus size={18} />
            <span>Adicionar evidência ({photos.length}/{maxPhotos})</span>
          </button>
        </div>
      </div>

      {isCompressing && (
        <div
          style={{
            padding: '12px',
            textAlign: 'center',
            color: '#38bdf8',
            fontSize: '0.85rem',
            background: 'rgba(56, 189, 248, 0.1)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px'
          }}
        >
          Otimizando evidência fotográfica...
        </div>
      )}

      {/* Category Filter Pills */}
      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedFilter === cat;
            const count =
              cat === 'Todos'
                ? photos.length
                : photos.filter((p) => (p.tipo || '').toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilter(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Evidence Gallery Grid */}
      {photos.length === 0 ? (
        <div
          style={{
            border: '2px dashed var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            padding: '50px 20px',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.4)'
          }}
        >
          <ImageIcon size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Nenhuma evidência registrada
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 20px' }}>
            Fotografe pontos críticos, avarias ou a identificação do equipamento para compor o laudo.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '10px 20px' }}
          >
            <Plus size={16} />
            <span>Adicionar evidência</span>
          </button>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhuma evidência cadastrada na categoria "{selectedFilter}".
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px'
          }}
        >
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Image Preview */}
              <div
                style={{
                  height: '150px',
                  position: 'relative',
                  cursor: 'pointer',
                  backgroundColor: '#020617'
                }}
                onClick={() => setPreviewPhoto(photo)}
              >
                <img
                  src={photo.base64Data}
                  alt={`Evidência ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#93c5fd'
                  }}
                >
                  {photo.tipo}
                </div>
              </div>

              {/* Card Meta & Controls */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select
                    value={photo.tipo}
                    onChange={(e) => handleUpdateTipo(photo.id, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '0.75rem', width: '100%' }}
                  >
                    <option value="Geral">Geral</option>
                    <option value="Frente">Frente</option>
                    <option value="Lateral">Lateral</option>
                    <option value="Traseira">Traseira</option>
                    <option value="Painel">Painel</option>
                    <option value="Avaria">Avaria</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={photo.descricao || ''}
                  onChange={(e) => handleUpdateDescription(photo.id, e.target.value)}
                  placeholder="Legenda / Descrição..."
                  style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '8px',
                    marginTop: 'auto'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(photo)}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={13} />
                    <span>Ampliar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    style={{
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Zoom */}
      {previewPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '800px',
              maxHeight: '90vh',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-strong)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Evidência: {previewPhoto.tipo} {previewPhoto.descricao ? `— ${previewPhoto.descricao}` : ''}
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
              <img
                src={previewPhoto.base64Data}
                alt="Ampliação"
                referrerPolicy="no-referrer"
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
