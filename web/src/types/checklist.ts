export type ChecklistItemStatus = 'CONFORME' | 'NAO_CONFORME' | 'NA' | 'NONE';

export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  status: ChecklistItemStatus;
  observation?: string;
  photoUrl?: string;
}

export interface ChecklistCategory {
  name: string;
  items: ChecklistItem[];
}

export interface Checklist {
  id: string;
  userId: string;
  companyId: string;
  platformId: string;
  model: string;
  owner: string;
  lessee?: string;
  serialNumber: string;
  operator: string;
  hourMeter: string;
  date: string;
  time: string;
  inspectionType: string;
  justification?: string;
  statusFinal?: string;
  photos: string[];
  categories: ChecklistCategory[];
  signatureUrl?: string;
  pdfUrl?: string;
  timestamp: number;
  isCompleted: boolean;
}
