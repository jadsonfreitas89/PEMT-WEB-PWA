export type InspectionItemStatus = 'CONFORME' | 'NAO_CONFORME' | 'NA' | 'NONE';

export interface InspectionItem {
  id: string;
  inspecaoId: string;
  categoria: string;
  descricao: string;
  status: InspectionItemStatus;
  observacao?: string | null;
  fotoUrl?: string | null;
}

export interface InspectionPhoto {
  id: string;
  inspecaoId: string;
  localPath?: string;
  remoteUrl?: string;
  base64Data?: string;
  tipo: string; // 'GERAL' | 'FRENTE' | 'LATERAL' | 'AVARIA' | 'PAINEL' | 'OUTRO'
  descricao?: string;
  timestamp: number;
}

export interface Inspection {
  id: string;
  empresaId: string;
  empresaNome?: string;
  usuarioId: string;
  inspetorNome?: string;
  inspetorCrea?: string;
  plataformaId: string;
  modelo?: string;
  numeroSerie?: string;
  proprietario?: string;
  locatario?: string;
  data: string; // DD/MM/AAAA
  hora: string; // HH:mm
  horimetro: string;
  tipoInspecao: 'PRE_USO' | 'PERIODICA' | 'PREVENTIVA' | 'POS_MANUTENCAO';
  statusFinal: 'APROVADA' | 'NÃO APROVADA' | 'REPROVADA';
  justificativa?: string | null;
  pdfLocalPath?: string | null;
  pdfRemoteUrl?: string | null;
  assinaturaLocalPath?: string | null;
  assinaturaRemoteUrl?: string | null;
  syncStatus?: 'LOCAL' | 'SYNCING' | 'SYNCED' | 'FAILED';
  timestamp: number;
  totalItens?: number;
  itensConformes?: number;
  itensNaoConformes?: number;
  itensNA?: number;
}

export interface InspectionCategory {
  nome: string;
  itens: {
    id: string;
    nome: string;
    status: InspectionItemStatus;
    observacao?: string;
    fotoUrl?: string;
  }[];
}
