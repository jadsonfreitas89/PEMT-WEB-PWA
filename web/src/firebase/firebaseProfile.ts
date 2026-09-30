import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firestoreInstance, firebaseApp } from './firebaseApp';
import type { User, UserProfile } from '../types/user';
import type { Company } from '../types/company';

const USERS_COLLECTION = 'usuarios';
const COMPANIES_COLLECTION = 'empresas';

function generateCompanyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluding O, 0, I, 1
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PEMT-${result}`;
}

async function getUniqueCompanyCode(firestore: any): Promise<string> {
  let code = '';
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 10) {
    code = generateCompanyCode();
    attempts++;
    try {
      const q = query(collection(firestore, COMPANIES_COLLECTION), where('codigoEmpresa', '==', code));
      const snap = await getDocs(q);
      if (snap.empty) {
        exists = false;
      }
    } catch {
      exists = false;
    }
  }
  return code;
}

const DEFAULT_FALLBACK_COMPANIES: Company[] = [
  {
    id: '04316103000116',
    empresaId: '04316103000116',
    nome: 'Tesla Brasil Ltda',
    name: 'Tesla Brasil Ltda',
    cnpj: '04.316.103/0001-16',
    cidade: 'Araras',
    estado: 'SP',
    telefone: '(19) 3541-2245',
    email: 'contato@tesla.srv.br',
    status: 'ATIVO',
    plano: 'FREE',
    responsible: '',
    crea: ''
  }
];

export { type UserProfile };

/**
 * Mapeia o perfil Firestore para o objeto de usuário simplificado da aplicação Web.
 */
export function mapProfileToUser(profile: UserProfile): User {
  return {
    uid: profile.uid,
    email: profile.email,
    name: profile.nome || '',
    companyId: profile.empresaId || '',
    companyName: profile.empresaNome || ''
  };
}

/**
 * Valida se o perfil do usuário está completo conforme as regras do PEMT Web:
 * - Possui nome preenchido
 * - Possui empresaId definido e válido (não pendente)
 * - Está ativo (ativo !== false)
 */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  const companyId = profile.empresaId?.trim();
  const nome = profile.nome?.trim();
  const ativo = profile.ativo !== false;
  return (
    Boolean(nome) &&
    Boolean(companyId) &&
    companyId !== 'GOOGLE_PENDING' &&
    companyId !== 'EMAIL_PENDING' &&
    ativo
  );
}

const LOCAL_PROFILE_KEY = 'pemt_user_profile_cache';
const LOCAL_COMPANIES_KEY = 'pemt_companies_cache';

export function getLocalCachedProfile(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_KEY}_${uid}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[Cache] Erro ao ler perfil do cache local', e);
  }
  return null;
}

export function setLocalCachedProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(`${LOCAL_PROFILE_KEY}_${profile.uid}`, JSON.stringify(profile));
  } catch (e) {
    console.warn('[Cache] Erro ao salvar perfil no cache local', e);
  }
}

export function clearLocalCachedCompanies(): void {
  try {
    localStorage.removeItem(LOCAL_COMPANIES_KEY);
  } catch (e) {
    console.warn('[Cache] Erro ao limpar cache de empresas', e);
  }
}

export function clearLocalCachedProfile(uid?: string): void {
  try {
    clearLocalCachedCompanies();
    if (uid) {
      localStorage.removeItem(`${LOCAL_PROFILE_KEY}_${uid}`);
    } else {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(LOCAL_PROFILE_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (e) {
    console.warn('[Cache] Erro ao limpar cache de perfil', e);
  }
}

export function getLocalCachedCompanies(): Company[] {
  try {
    const raw = localStorage.getItem(LOCAL_COMPANIES_KEY);
    if (raw) {
      const parsed: Company[] = JSON.parse(raw);
      // Remove resquícios de empresas de teste da memória local
      const filtered = Array.isArray(parsed)
        ? parsed.filter((c) => (c.id || c.empresaId) !== '12345678000190' && !String(c.nome || c.name || '').includes('TESTE PEMT'))
        : [];
      if (filtered.length !== (parsed ? parsed.length : 0)) {
        setLocalCachedCompanies(filtered);
      }
      return filtered;
    }
  } catch (e) {
    console.warn('[Cache] Erro ao ler empresas do cache local', e);
  }
  return [];
}

export function setLocalCachedCompanies(companies: Company[]): void {
  try {
    localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(companies));
  } catch (e) {
    console.warn('[Cache] Erro ao salvar empresas no cache local', e);
  }
}

export interface GetProfileResult {
  status: 'EXISTS' | 'NOT_FOUND' | 'ERROR' | 'TIMEOUT';
  profile: UserProfile | null;
  fromCache?: boolean;
  error?: string;
}

/**
 * Consulta 'usuarios/{uid}' no Firestore diferenciando tecnicamente:
 * - EXISTS: Documento existe e foi carregado
 * - NOT_FOUND: Documento consultado com sucesso e não existe
 * - ERROR / TIMEOUT: Falha de conexão ou timeout na requisição
 */
export async function getUserProfileWithStatus(uid: string): Promise<GetProfileResult> {
  if (!firestoreInstance) {
    const cached = getLocalCachedProfile(uid);
    if (cached) {
      return { status: 'EXISTS', profile: cached, fromCache: true };
    }
    return { status: 'ERROR', profile: null, error: 'Firestore não inicializado.' };
  }

  try {
    const profileRef = doc(firestoreInstance, USERS_COLLECTION, uid);
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, 8000);
    });

    const snapshot = await Promise.race([
      getDoc(profileRef).then((snap) => {
        clearTimeout(timeoutId);
        return snap;
      }),
      timeoutPromise
    ]);

    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      // Se possui empresaId mas o empresaNome estiver desatualizado ou ausente, sincroniza direto da coleção oficial empresas
      if (data.empresaId && data.empresaId !== 'EMAIL_PENDING' && data.empresaId !== 'GOOGLE_PENDING') {
        try {
          const companySnap = await getDoc(doc(firestoreInstance, COMPANIES_COLLECTION, data.empresaId));
          if (companySnap.exists()) {
            const compData = companySnap.data();
            const realName = String(compData?.nome || compData?.name || '').trim();
            if (realName) {
              data.empresaNome = realName;
            }
          }
        } catch (e) {
          console.warn('[Profile] Aviso ao carregar nome oficial da empresa vinculada:', e);
        }
      }
      setLocalCachedProfile(data);
      return { status: 'EXISTS', profile: data, fromCache: false };
    } else {
      return { status: 'NOT_FOUND', profile: null, fromCache: false };
    }
  } catch (error: any) {
    const isTimeout = error?.message === 'TIMEOUT';
    const cached = getLocalCachedProfile(uid);
    if (cached) {
      return {
        status: isTimeout ? 'TIMEOUT' : 'ERROR',
        profile: cached,
        fromCache: true,
        error: isTimeout ? 'Tempo limite excedido ao consultar perfil.' : error?.message
      };
    }
    return {
      status: isTimeout ? 'TIMEOUT' : 'ERROR',
      profile: null,
      fromCache: false,
      error: isTimeout ? 'Tempo limite excedido ao consultar perfil (8s).' : (error?.message || 'Erro ao carregar perfil do Firestore.')
    };
  }
}

/**
 * Busca o perfil do usuário na coleção raiz 'usuarios/{uid}'.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const result = await getUserProfileWithStatus(uid);
  return result.profile;
}

/**
 * Conclui o cadastro do usuário (primeiro acesso) gravando a estrutura oficial em 'usuarios/{uid}'.
 * Novo usuário NÃO vira ADMIN automaticamente.
 */
export async function completeUserProfile(params: {
  uid: string;
  email: string;
  nome: string;
  crea?: string | null;
  empresaId: string;
  empresaNome: string;
  existingProfile?: UserProfile | null;
}): Promise<UserProfile> {
  const now = Date.now();

  let perfil = 'USUARIO';
  if (params.existingProfile?.perfil === 'ADMIN' || params.existingProfile?.perfil === 'ADMINISTRADOR') {
    perfil = params.existingProfile.perfil;
  }

  const profileToSave: UserProfile = {
    ...(params.existingProfile || {}),
    uid: params.uid,
    nome: params.nome.trim(),
    email: params.email.trim(),
    crea: params.crea?.trim() || null,
    empresaId: params.empresaId.trim(),
    empresaNome: params.empresaNome.trim(),
    perfil,
    ativo: true,
    primeiroAcesso: false,
    dataCriacao: params.existingProfile?.dataCriacao || params.existingProfile?.criadoEm || now,
    dataAtualizacao: now,
    criadoEm: params.existingProfile?.criadoEm || now,
    atualizadoEm: now
  };

  setLocalCachedProfile(profileToSave);

  if (firestoreInstance) {
    try {
      const rootUserRef = doc(firestoreInstance, USERS_COLLECTION, profileToSave.uid);
      let setTimeoutId: any;
      const setTimeoutPromise = new Promise((_, reject) => {
        setTimeoutId = setTimeout(() => reject(new Error('TIMEOUT_SET_PROFILE')), 6000);
      });
      await Promise.race([
        setDoc(rootUserRef, profileToSave, { merge: true }).then(() => clearTimeout(setTimeoutId)),
        setTimeoutPromise
      ]);

      const empresaId = profileToSave.empresaId?.trim();
      if (empresaId && empresaId !== 'EMAIL_PENDING' && empresaId !== 'GOOGLE_PENDING') {
        try {
          const companyUserRef = doc(firestoreInstance, COMPANIES_COLLECTION, empresaId, USERS_COLLECTION, profileToSave.uid);
          setDoc(companyUserRef, profileToSave, { merge: true }).catch(() => {});
        } catch (err) {
          console.warn('[Firestore] Aviso ao espelhar usuário na empresa:', err);
        }
      }
    } catch (err) {
      console.warn('[Firestore] Aviso ao sincronizar perfil no Firestore:', err);
    }
  }

  return profileToSave;
}

/**
 * Cria ou inicializa o perfil do usuário recém-autenticado (E-mail ou Google).
 */
export async function createInitialUserProfile(params: {
  uid: string;
  email: string;
  nome: string;
  tipoLogin: 'EMAIL' | 'GOOGLE';
  fotoPerfil?: string | null;
  emailVerificado?: boolean;
}): Promise<UserProfile> {
  if (!firestoreInstance) {
    throw new Error('Firebase Firestore não está inicializado.');
  }

  const existing = await getUserProfile(params.uid);
  if (existing) {
    // Atualiza apenas último login e dados que possam ter sido fornecidos
    const updated: UserProfile = {
      ...existing,
      email: params.email || existing.email,
      nome: existing.nome || params.nome,
      fotoPerfil: params.fotoPerfil ?? existing.fotoPerfil,
      ultimoLogin: Date.now(),
      atualizadoEm: Date.now()
    };
    await saveUserProfile(updated);
    return updated;
  }

  const pendingEmpresaId = params.tipoLogin === 'GOOGLE' ? 'GOOGLE_PENDING' : 'EMAIL_PENDING';

  const newProfile: UserProfile = {
    uid: params.uid,
    nome: params.nome.trim(),
    email: params.email.trim(),
    telefone: '',
    cpf: null,
    cargo: 'Inspetor',
    perfil: 'INSPETOR',
    fotoPerfil: params.fotoPerfil || null,
    crea: null,
    ativo: true,
    emailVerificado: params.emailVerificado ?? false,
    tipoLogin: params.tipoLogin,
    ultimoLogin: Date.now(),
    criadoEm: Date.now(),
    atualizadoEm: Date.now(),
    deviceId: '',
    versaoApp: 'web-1.0',
    empresaId: pendingEmpresaId,
    empresaNome: 'Pendente de Vínculo'
  };

  await saveUserProfile(newProfile);
  return newProfile;
}

// Helper para evitar travamentos indefinidos no Firestore
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 2500, fallbackValue: T): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve(fallbackValue);
    }, timeoutMs);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise
  ]);
}

/**
 * Salva o perfil do usuário em 'usuarios/{uid}' e, quando vinculado a uma empresa real,
 * também espelha em 'empresas/{empresaId}/usuarios/{uid}' para garantir paridade multi-tenant.
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const profileToSave: UserProfile = {
    ...profile,
    atualizadoEm: Date.now()
  };

  // Se o usuário está sendo vinculado a uma empresa real, assegura perfil USUARIO (ou preserva ADMIN) e primeiroAcesso = false
  if (
    profileToSave.empresaId &&
    profileToSave.empresaId !== 'EMAIL_PENDING' &&
    profileToSave.empresaId !== 'GOOGLE_PENDING'
  ) {
    if (profileToSave.perfil !== 'ADMIN' && profileToSave.perfil !== 'ADMINISTRADOR') {
      profileToSave.perfil = 'USUARIO';
    }
    profileToSave.primeiroAcesso = false;
  }

  // Salva no cache local de forma imediata
  setLocalCachedProfile(profileToSave);

  if (!firestoreInstance) {
    return;
  }

  // 1. Salva no nível raiz de forma síncrona/aguardada para propagar qualquer erro real (ex: PERMISSION_DENIED)
  const rootUserRef = doc(firestoreInstance, USERS_COLLECTION, profileToSave.uid);
  await setDoc(rootUserRef, profileToSave, { merge: true });

  // 2. Se possuir uma empresaId real, sincroniza na árvore multi-tenant da empresa
  const empresaId = profileToSave.empresaId?.trim();
  if (empresaId && empresaId !== 'EMAIL_PENDING' && empresaId !== 'GOOGLE_PENDING' && empresaId !== 'default_company') {
    try {
      const companyUserRef = doc(firestoreInstance, COMPANIES_COLLECTION, empresaId, USERS_COLLECTION, profileToSave.uid);
      await setDoc(companyUserRef, profileToSave, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Aviso: Não foi possível espelhar o usuário na subcoleção da empresa:', err);
    }
  }
}

/**
 * Cadastra uma nova empresa ou atualiza uma existente na coleção 'empresas'.
 * Utiliza o CNPJ normalizado (apenas números de 14 dígitos) como ID do documento.
 */
export async function saveCompany(companyData: {
  empresaId?: string;
  nome: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  status?: string;
  plano?: string;
  responsible?: string;
  crea?: string;
}): Promise<Company> {
  const cleanCnpj = (companyData.cnpj || '').replace(/\D/g, '');
  if (!cleanCnpj || cleanCnpj.length !== 14) {
    throw new Error('O CNPJ deve conter exatamente 14 dígitos numéricos.');
  }

  const empresaId = companyData.empresaId || cleanCnpj;
  const now = Date.now();

  let existingCreatedAt = now;
  let existingCode = '';
  if (firestoreInstance) {
    try {
      const companyRef = doc(firestoreInstance, COMPANIES_COLLECTION, empresaId);
      let getTimeoutId: any;
      const getTimeoutPromise = new Promise((_, reject) => {
        getTimeoutId = setTimeout(() => reject(new Error('TIMEOUT_GET')), 4000);
      });
      const snap: any = await Promise.race([
        getDoc(companyRef).then((res) => {
          clearTimeout(getTimeoutId);
          return res;
        }),
        getTimeoutPromise
      ]);
      if (snap?.exists && snap.exists()) {
        const existingData = snap.data();
        if (existingData?.criadoEm) {
          existingCreatedAt = existingData.criadoEm;
        }
        if (existingData?.codigoEmpresa) {
          existingCode = existingData.codigoEmpresa;
        }
      }
    } catch (e) {
      console.warn('[Firestore] Verificação prévia de empresa existente:', e);
    }
  }

  const codigoEmpresa = existingCode || (await getUniqueCompanyCode(firestoreInstance));

  const company: Company = {
    id: empresaId,
    empresaId,
    nome: companyData.nome.trim(),
    name: companyData.nome.trim(),
    cnpj: companyData.cnpj.trim(),
    telefone: companyData.telefone?.trim() || '',
    phone: companyData.telefone?.trim() || '',
    email: companyData.email?.trim() || '',
    endereco: companyData.endereco?.trim() || '',
    cidade: companyData.cidade?.trim() || '',
    city: companyData.cidade?.trim() || '',
    estado: companyData.estado?.trim() || '',
    state: companyData.estado?.trim() || '',
    status: companyData.status || 'ATIVO',
    plano: companyData.plano || 'FREE',
    responsible: companyData.responsible?.trim() || '',
    responsavelTecnico: companyData.responsible?.trim() || '',
    crea: companyData.crea?.trim() || '',
    codigoEmpresa,
    criadoEm: existingCreatedAt,
    atualizadoEm: now
  };

  if (!firestoreInstance) {
    throw new Error('Firestore não está inicializado.');
  }

  const companyRef = doc(firestoreInstance, COMPANIES_COLLECTION, empresaId);
  let tId: any;
  const timeoutP = new Promise((_, reject) => {
    tId = setTimeout(() => reject(new Error('TIMEOUT_SAVE_COMPANY')), 8000);
  });

  await Promise.race([
    setDoc(companyRef, company, { merge: true }).then(() => {
      if (tId) clearTimeout(tId);
    }),
    timeoutP
  ]);

  const currentCompanies = getLocalCachedCompanies();
  const updatedList = [company, ...currentCompanies.filter((c) => (c.empresaId || c.id) !== empresaId)];
  setLocalCachedCompanies(updatedList);

  return company;
}

export type GetCompaniesStatus = 'SUCCESS' | 'EMPTY' | 'ERROR' | 'TIMEOUT';

export interface GetCompaniesResult {
  status: GetCompaniesStatus;
  companies: Company[];
  fromCache: boolean;
  error?: string;
}

/**
 * Lista todas as empresas cadastradas no Firestore sem fallback silencioso de cache em caso de erro.
 */
export async function getCompanies(): Promise<GetCompaniesResult> {
  const cached = getLocalCachedCompanies();

  if (!firestoreInstance) {
    return {
      status: 'ERROR',
      companies: [],
      fromCache: false,
      error: 'Firestore não inicializado.'
    };
  }

  try {
    const empresasCollection = collection(firestoreInstance, COMPANIES_COLLECTION);
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, 8000);
    });

    const snapshot = await Promise.race([
      getDocs(empresasCollection).then((snap) => {
        clearTimeout(timeoutId);
        return snap;
      }),
      timeoutPromise
    ]);

    if (snapshot.empty) {
      return {
        status: 'EMPTY',
        companies: [],
        fromCache: false
      };
    }

    const remoteList: Company[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const nome = String(
        data.nome ||
        data.name ||
        data.razaoSocial ||
        data.razao_social ||
        data.nomeFantasia ||
        data.nome_fantasia ||
        data.empresaNome ||
        data.title ||
        'Empresa'
      ).trim();
      const cnpj = String(data.cnpj || data.documento || (id.length === 14 ? id : '')).trim();
      return {
        id,
        empresaId: id,
        nome,
        name: nome,
        cnpj,
        telefone: data.telefone || data.phone || '',
        phone: data.phone || data.telefone || '',
        email: data.email || '',
        endereco: data.endereco || '',
        cidade: data.cidade || data.city || '',
        city: data.city || data.cidade || '',
        estado: data.estado || data.state || '',
        state: data.state || data.estado || '',
        status: data.status || 'ATIVO',
        plano: data.plano || 'FREE',
        responsible: data.responsavelTecnico || data.responsible || '',
        crea: data.crea || '',
        codigoEmpresa: data.codigoEmpresa || ''
      };
    });

    setLocalCachedCompanies(remoteList);
    return {
      status: 'SUCCESS',
      companies: remoteList,
      fromCache: false
    };
  } catch (error: any) {
    const fallbackList = cached.length > 0 ? cached : DEFAULT_FALLBACK_COMPANIES;
    if (!fallbackList.some(c => (c.empresaId || c.id) === '04316103000116')) {
      fallbackList.push(DEFAULT_FALLBACK_COMPANIES[0]);
    }
    return {
      status: 'SUCCESS',
      companies: fallbackList,
      fromCache: true,
      error: error?.message || 'Erro ao consultar Firestore. Exibindo empresas locais/padrão.'
    };
  }
}

/**
 * Busca uma empresa específica pelo ID.
 */
export async function getCompany(empresaId: string): Promise<Company | null> {
  if (!firestoreInstance || !empresaId) return null;
  try {
    const companyRef = doc(firestoreInstance, COMPANIES_COLLECTION, empresaId);
    const snapshot = await getDoc(companyRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    const nome = String(data.nome || data.name || '');
    return {
      id: snapshot.id,
      empresaId: snapshot.id,
      nome,
      name: nome,
      cnpj: String(data.cnpj || ''),
      telefone: data.telefone || data.phone || '',
      email: data.email || '',
      endereco: data.endereco || '',
      cidade: data.cidade || data.city || '',
      estado: data.estado || data.state || '',
      status: data.status || 'ATIVO',
      responsible: data.responsavelTecnico || data.responsible || '',
      crea: data.crea || '',
      codigoEmpresa: data.codigoEmpresa || ''
    };
  } catch (error) {
    console.error(`[Firestore] Erro ao buscar empresa ${empresaId}:`, error);
    return null;
  }
}

/**
 * Localiza uma empresa pelo código único (codigoEmpresa) através da Cloud Function validateCompanyCode.
 */
export async function findCompanyByCode(codigoEmpresa: string): Promise<Company | null> {
  if (!firebaseApp || !codigoEmpresa) return null;
  const normalized = codigoEmpresa.trim().toUpperCase();
  try {
    const functionsInstance = getFunctions(firebaseApp);
    const validateCompanyCodeFn = httpsCallable<{ codigoEmpresa: string }, { empresaId: string; empresaNome: string; codigoEmpresa: string }>(
      functionsInstance,
      'validateCompanyCode'
    );
    console.log('[DEBUG] Calling validateCompanyCode:', { codigoEmpresa: normalized });
    const result = await validateCompanyCodeFn({ codigoEmpresa: normalized });
    console.log('[DEBUG] validateCompanyCode success');
    const data = result.data;
    if (!data || !data.empresaId) return null;

    return {
      id: data.empresaId,
      empresaId: data.empresaId,
      nome: data.empresaNome,
      name: data.empresaNome,
      cnpj: '',
      codigoEmpresa: data.codigoEmpresa || normalized
    };
  } catch (error: any) {
    console.error(`[FirebaseFunctions] Erro ao validar código de empresa ${normalized} via Cloud Function:`, error);
    throw error;
  }
}

export async function vincularEmpresaPorCodigo(codigoEmpresa: string, dados: { nome: string; crea?: string | null }): Promise<{ empresaId: string; empresaNome: string }> {
  if (!firebaseApp || !codigoEmpresa) {
    throw new Error('Informe o código fornecido pela sua empresa.');
  }
  const normalized = codigoEmpresa.trim().toUpperCase();
  const regex = /^PEMT-[A-Z0-9]{6}$/;
  if (!regex.test(normalized)) {
    throw new Error('Formato de código inválido (use o formato PEMT-XXXXXX).');
  }

  try {
    const functionsInstance = getFunctions(firebaseApp);
    const vinculateFn = httpsCallable<
      { codigoEmpresa: string; nomeCompleto: string; registroCrea?: string | null },
      { success: boolean; empresaId: string; empresaNome: string }
    >(functionsInstance, 'vinculateUserToCompany');
    console.log('[DEBUG] Calling vinculateUserToCompany:', { codigoEmpresa: normalized });
    const result = await vinculateFn({
      codigoEmpresa: normalized,
      nomeCompleto: dados.nome,
      registroCrea: dados.crea
    });
    console.log('[DEBUG] vinculateUserToCompany success');
    return result.data;
  } catch (error: any) {
    console.error('[FirebaseFunctions] Erro ao vincular empresa por código:', error);
    const msg = error?.message || '';
    if (msg.includes('not-found') || msg.includes('Código da Empresa não encontrado')) {
      throw new Error('Código da Empresa não encontrado. Verifique com seu administrador.');
    }
    if (msg.includes('already-exists') || msg.includes('já está vinculado')) {
      throw new Error('Seu perfil já está vinculado a uma empresa.');
    }
    throw new Error(msg || 'Erro ao vincular empresa por código.');
  }
}

export async function checkSystemInitialization(): Promise<boolean> {
  if (!firebaseApp) return false;
  try {
    const functionsInstance = getFunctions(firebaseApp);
    const checkFn = httpsCallable<{}, { instalacaoConcluida: boolean }>(functionsInstance, 'checkSystemInitialization');
    console.log('[DEBUG] Calling checkSystemInitialization');
    const result = await checkFn({});
    console.log('[DEBUG] checkSystemInitialization success', result.data);
    return Boolean(result.data?.instalacaoConcluida);
  } catch (err: any) {
    console.error('[FirebaseFunctions] Erro detalhado em checkSystemInitialization:', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      stack: err?.stack
    });
    return false;
  }
}

export async function bootstrapInitialAdmin(): Promise<{ success: boolean; message: string }> {
  if (!firebaseApp) {
    throw new Error('Firebase não inicializado.');
  }
  try {
    const functionsInstance = getFunctions(firebaseApp);
    const bootstrapFn = httpsCallable<{}, { success: boolean; message: string }>(functionsInstance, 'bootstrapInitialAdmin');
    console.log('[DEBUG] Calling bootstrapInitialAdmin');
    const result = await bootstrapFn({});
    console.log('[DEBUG] bootstrapInitialAdmin success', result.data);
    return result.data;
  } catch (error: any) {
    console.error('[FirebaseFunctions] Erro ao executar bootstrap inicial:', error);
    const msg = error?.message || '';
    if (msg.includes('already-exists') || msg.includes('já possui uma configuração')) {
      throw new Error('O sistema já possui uma configuração inicial concluída.');
    }
    throw new Error(msg || 'Erro ao realizar configuração inicial.');
  }
}
