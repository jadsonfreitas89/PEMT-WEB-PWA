import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from '../../firebase/firebaseApp';

export interface CreateCompanyPayload {
  cnpj: string;
  nome: string;
  razaoSocial?: string;
}

export interface CreateCompanyResult {
  empresaId: string;
  empresaNome: string;
  codigoEmpresa: string;
}

export interface CreateUserPayload {
  nome: string;
  empresaId: string;
  perfil: 'ADMIN' | 'USUARIO' | 'TECNICO';
}

export interface CreateUserResult {
  uid: string;
  codigoPessoal: string;
}

export async function adminCreateCompany(payload: CreateCompanyPayload): Promise<CreateCompanyResult> {
  if (!firebaseApp) {
    throw new Error('Firebase não inicializado.');
  }
  const functionsInstance = getFunctions(firebaseApp);
  const fn = httpsCallable<CreateCompanyPayload, CreateCompanyResult>(functionsInstance, 'adminCreateCompany');
  console.log('[DEBUG] Calling adminCreateCompany:', { payload });
  try {
    const result = await fn(payload);
    console.log('[DEBUG] adminCreateCompany success');
    return result.data;
  } catch (error: any) {
    console.error('[DEBUG] adminCreateCompany failed:', { code: error.code, message: error.message, details: error.details });
    throw error;
  }
}

export async function adminCreateUser(payload: CreateUserPayload): Promise<CreateUserResult> {
  if (!firebaseApp) {
    throw new Error('Firebase não inicializado.');
  }
  const functionsInstance = getFunctions(firebaseApp);
  const fn = httpsCallable<CreateUserPayload, CreateUserResult>(functionsInstance, 'adminCreateUser');
  console.log('[DEBUG] Calling adminCreateUser:', { payload });
  try {
    const result = await fn(payload);
    console.log('[DEBUG] adminCreateUser success');
    return result.data;
  } catch (error: any) {
    console.error('[DEBUG] adminCreateUser failed:', { code: error.code, message: error.message, details: error.details });
    throw error;
  }
}

export interface UpdateCompanyPayload {
  empresaId: string;
  nome: string;
  razaoSocial?: string;
}

export interface ToggleCompanyStatusPayload {
  empresaId: string;
  ativo: boolean;
}

export async function adminUpdateCompany(payload: UpdateCompanyPayload): Promise<{ success: boolean; empresaId: string; empresaNome: string }> {
  if (!firebaseApp) {
    throw new Error('Firebase não inicializado.');
  }
  const functionsInstance = getFunctions(firebaseApp);
  const fn = httpsCallable<UpdateCompanyPayload, { success: boolean; empresaId: string; empresaNome: string }>(functionsInstance, 'adminUpdateCompany');
  console.log('[DEBUG] Calling adminUpdateCompany:', { payload });
  try {
    const result = await fn(payload);
    console.log('[DEBUG] adminUpdateCompany success');
    return result.data;
  } catch (error: any) {
    console.error('[DEBUG] adminUpdateCompany failed:', { code: error.code, message: error.message, details: error.details });
    throw error;
  }
}

export async function adminToggleCompanyStatus(payload: ToggleCompanyStatusPayload): Promise<{ success: boolean; empresaId: string; ativo: boolean }> {
  if (!firebaseApp) {
    throw new Error('Firebase não inicializado.');
  }
  const functionsInstance = getFunctions(firebaseApp);
  const fn = httpsCallable<ToggleCompanyStatusPayload, { success: boolean; empresaId: string; ativo: boolean }>(functionsInstance, 'adminToggleCompanyStatus');
  console.log('[DEBUG] Calling adminToggleCompanyStatus:', { payload });
  try {
    const result = await fn(payload);
    console.log('[DEBUG] adminToggleCompanyStatus success');
    return result.data;
  } catch (error: any) {
    console.error('[DEBUG] adminToggleCompanyStatus failed:', { code: error.code, message: error.message, details: error.details });
    throw error;
  }
}
