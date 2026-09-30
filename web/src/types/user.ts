export type PerfilUsuario = 'ADMIN' | 'USUARIO' | 'ADMINISTRADOR' | 'SUPERVISOR' | 'INSPETOR' | 'CLIENTE';

export interface User {
  uid: string;
  email: string;
  name: string;
  companyId: string;
  companyName: string;
  role?: string;
  crea?: string;
  ativo?: boolean;
}

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  crea?: string | null;
  empresaId: string;
  empresaNome: string;
  perfil?: PerfilUsuario | string;
  ativo: boolean;
  primeiroAcesso?: boolean;
  dataCriacao?: number;
  dataAtualizacao?: number;
  // Campos de compatibilidade
  telefone?: string;
  cpf?: string | null;
  cargo?: string;
  fotoPerfil?: string | null;
  emailVerificado?: boolean;
  tipoLogin?: 'EMAIL' | 'GOOGLE' | string;
  ultimoLogin?: number;
  criadoEm?: number;
  atualizadoEm?: number;
  deviceId?: string;
  versaoApp?: string;
}

