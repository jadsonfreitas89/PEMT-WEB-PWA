export interface Platform {
  id: string;
  empresaId: string;
  modelo: string;
  numeroSerie: string;
  anoFabricacao?: string;
  proprietario: string;
  locatario?: string | null;
  fotoUrl?: string | null;
  criadoEm?: number;
}
