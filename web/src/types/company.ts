export interface Company {
  id?: string;
  empresaId: string;
  nome: string;
  name?: string;
  razaoSocial?: string;
  cnpj: string;
  telefone?: string;
  phone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  city?: string;
  estado?: string;
  state?: string;
  responsible?: string;
  responsavelTecnico?: string;
  crea?: string;
  codigoEmpresa?: string;
  ativo?: boolean;
  status?: 'ATIVO' | 'SUSPENSO' | 'CANCELADO' | string;
  plano?: string;
  licencaValidaAte?: number | null;
  criadoEm?: number;
  atualizadoEm?: number;
}

