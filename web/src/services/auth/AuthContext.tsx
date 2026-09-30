import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import AuthService from './AuthService';
import {
  getUserProfileWithStatus,
  completeUserProfile,
  saveUserProfile,
  isProfileComplete,
  mapProfileToUser,
  clearLocalCachedProfile,
  checkSystemInitialization
} from '../../firebase/firebaseProfile';
import type { User, UserProfile } from '../../types/user';

export type AuthState =
  | 'AUTH_LOADING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED_NO_PROFILE'
  | 'AUTHENTICATED_PROFILE_INCOMPLETE'
  | 'AUTHENTICATED_PROFILE_COMPLETE';

export interface AuthContextValue {
  authState: AuthState;
  user: User | null;
  profile: UserProfile | null;
  companyId: string;
  companyName: string;
  empresaId: string;
  empresaNome: string;
  loading: boolean;
  isAuthenticated: boolean;
  profileComplete: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  completeProfile: (data: {
    nome: string;
    crea?: string | null;
    empresaId: string;
    empresaNome: string;
  }) => Promise<UserProfile>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  systemInitialized: boolean;
  checkingSystemInit: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('AUTH_LOADING');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [systemInitialized, setSystemInitialized] = useState<boolean>(true);
  const [checkingSystemInit, setCheckingSystemInit] = useState<boolean>(true);

  useEffect(() => {
    console.log('[AUTH DEBUG] iniciando checkSystemInitialization');
    checkSystemInitialization()
      .then((res) => {
        console.log('[AUTH DEBUG] checkSystemInitialization resultado:', res);
        setSystemInitialized(res);
      })
      .catch((err) => {
        console.error('[AUTH DEBUG] erro checkSystemInitialization:', {
          name: err?.name,
          code: err?.code,
          message: err?.message,
          stack: err?.stack
        });
        setSystemInitialized(true);
      })
      .finally(() => {
        setCheckingSystemInit(false);
      });
  }, []);

  const profileComplete = useMemo(() => authState === 'AUTHENTICATED_PROFILE_COMPLETE', [authState]);
  const isAuthenticated = useMemo(
    () => authState !== 'UNAUTHENTICATED' && authState !== 'AUTH_LOADING',
    [authState]
  );
  const loading = useMemo(() => authState === 'AUTH_LOADING', [authState]);

  const companyId = useMemo(() => profile?.empresaId || user?.companyId || '', [profile, user]);
  const companyName = useMemo(() => profile?.empresaNome || user?.companyName || '', [profile, user]);

  /**
   * Avalia a situação do perfil em 'usuarios/{uid}' após confirmação de autenticação:
   * SITUAÇÃO A: Perfil completo e ativo -> AUTHENTICATED_PROFILE_COMPLETE
   * SITUAÇÃO B: Usuário autenticado, mas documento não existe -> AUTHENTICATED_NO_PROFILE
   * SITUAÇÃO C: Documento existe mas campos obrigatórios incompletos -> AUTHENTICATED_PROFILE_INCOMPLETE
   * Caso de Inativo: ativo === false -> Desconecta e informa desativação
   */
  const evaluateUserProfile = useCallback(async (firebaseUser: { uid: string; email?: string | null; displayName?: string | null }) => {
    console.log('[ADMIN DEBUG] Firebase UID:', firebaseUser.uid);
    console.log('[ADMIN DEBUG] Email Auth:', firebaseUser.email);

    const isAdminEmail = firebaseUser.email?.toLowerCase() === 'admin@pemt.local' || firebaseUser.email?.toLowerCase() === 'admin@pemt.com.br';

    try {
      const result = await getUserProfileWithStatus(firebaseUser.uid);
      console.log('[ADMIN DEBUG] Perfil carregado status:', result.status);
      console.log('[ADMIN DEBUG] Perfil carregado dados:', result.profile);

      let prof = result.profile;

      // Se for o e-mail técnico do admin e o documento no Firestore não existir ou não tiver perfil ADMIN, auto-cria/corrige o perfil de ADMIN
      if (isAdminEmail && (result.status === 'NOT_FOUND' || !prof || (prof.perfil !== 'ADMIN' && prof.perfil !== 'ADMINISTRADOR'))) {
        console.log('[ADMIN DEBUG] Reparando/Criando perfil ADMIN no Firestore para UID:', firebaseUser.uid);
        
        // Regra de primeiroAcesso:
        // 1. Se o documento já existe e tem primeiroAcesso definido (boolean), preserva o valor existente (true ou false).
        // 2. Se o documento é NOVO (NOT_FOUND) ou primeiroAcesso está ausente/undefined, define como true (primeiro acesso obrigatório).
        const targetPrimeiroAcesso = typeof prof?.primeiroAcesso === 'boolean' ? prof.primeiroAcesso : true;

        prof = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'admin@pemt.local',
          nome: firebaseUser.displayName || prof?.nome || 'Administrador Inicial',
          perfil: 'ADMIN',
          ativo: true,
          primeiroAcesso: targetPrimeiroAcesso,
          empresaId: prof?.empresaId || '',
          empresaNome: prof?.empresaNome || '',
          criadoEm: prof?.criadoEm || Date.now(),
          atualizadoEm: Date.now()
        };
        await saveUserProfile(prof);
      }

      if (!prof && result.status === 'NOT_FOUND') {
        // SITUAÇÃO B: Autenticou, mas não possui documento usuarios/{uid}
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          companyId: '',
          companyName: ''
        });
        setProfile(null);
        setAuthState('AUTHENTICATED_NO_PROFILE');
        console.log('[ADMIN DEBUG] auth state: AUTHENTICATED_NO_PROFILE');
        return null;
      }

      if (prof) {
        // Validação de conta ativa
        if (prof.ativo === false) {
          console.warn('[AuthContext] Usuário desativado pelo administrador:', prof.uid);
          await AuthService.logout();
          setUser(null);
          setProfile(null);
          setAuthError('Sua conta está desativada no sistema. Entre em contato com o administrador.');
          setAuthState('UNAUTHENTICATED');
          console.log('[ADMIN DEBUG] auth state: UNAUTHENTICATED (conta desativada)');
          return null;
        }

        setProfile(prof);
        setUser(mapProfileToUser(prof));

        const complete = isProfileComplete(prof);
        console.log('[ADMIN DEBUG] profile role:', prof.perfil);
        console.log('[ADMIN DEBUG] primeiroAcesso:', prof.primeiroAcesso);
        console.log('[ADMIN DEBUG] empresaId:', prof.empresaId);
        console.log('[ADMIN DEBUG] ativo:', prof.ativo);
        console.log('[ADMIN DEBUG] profile complete:', complete);

        if (complete) {
          setAuthState('AUTHENTICATED_PROFILE_COMPLETE');
          console.log('[ADMIN DEBUG] auth state: AUTHENTICATED_PROFILE_COMPLETE');
        } else {
          setAuthState('AUTHENTICATED_PROFILE_INCOMPLETE');
          console.log('[ADMIN DEBUG] auth state: AUTHENTICATED_PROFILE_INCOMPLETE');
        }
        return prof;
      }

      // Se ocorreu erro ou timeout mas há cache válido
      if (result.fromCache && result.profile) {
        const prof = result.profile;
        if (prof.ativo === false) {
          await AuthService.logout();
          setAuthError('Sua conta está desativada no sistema.');
          setAuthState('UNAUTHENTICATED');
          return null;
        }
        setProfile(prof);
        setUser(mapProfileToUser(prof));
        setAuthState(isProfileComplete(prof) ? 'AUTHENTICATED_PROFILE_COMPLETE' : 'AUTHENTICATED_PROFILE_INCOMPLETE');
        return prof;
      }

      // Falha irrecuperável de rede ou ausência de perfil
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        companyId: '',
        companyName: ''
      });
      setProfile(null);
      setAuthState('AUTHENTICATED_NO_PROFILE');
      return null;
    } catch (err: any) {
      console.error('[AuthContext] Erro ao avaliar perfil:', err);
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        companyId: '',
        companyName: ''
      });
      setProfile(null);
      setAuthState('AUTHENTICATED_NO_PROFILE');
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      if (!isMounted) return;

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setAuthState('UNAUTHENTICATED');
        return;
      }

      setAuthState('AUTH_LOADING');
      await evaluateUserProfile(firebaseUser);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [evaluateUserProfile]);

  const register = async (email: string, password: string, name: string) => {
    setAuthState('AUTH_LOADING');
    setAuthError(null);
    try {
      const fbUser = await AuthService.register(email, password, name);
      await evaluateUserProfile(fbUser);
    } catch (err) {
      setAuthState('UNAUTHENTICATED');
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState('AUTH_LOADING');
    setAuthError(null);
    try {
      const fbUser = await AuthService.login(email, password);
      await evaluateUserProfile(fbUser);
    } catch (err) {
      setAuthState('UNAUTHENTICATED');
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setAuthState('AUTH_LOADING');
    setAuthError(null);
    try {
      const fbUser = await AuthService.loginWithGoogle();
      await evaluateUserProfile(fbUser);
    } catch (err) {
      setAuthState('UNAUTHENTICATED');
      throw err;
    }
  };

  const logout = async () => {
    setAuthState('AUTH_LOADING');
    try {
      clearLocalCachedProfile();
      await AuthService.logout();
      setUser(null);
      setProfile(null);
      setAuthError(null);
      setAuthState('UNAUTHENTICATED');
    } catch (err) {
      console.error('[AuthContext] Erro ao realizar logout:', err);
      clearLocalCachedProfile();
      setAuthState('UNAUTHENTICATED');
    }
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const changePassword = async (newPassword: string) => {
    const { default: auth } = await import('../../firebase/firebaseAuth');
    await auth.changePassword(newPassword);
    await refreshProfile();
  };

  const completeProfileHandler = async (data: {
    nome: string;
    crea?: string | null;
    empresaId: string;
    empresaNome: string;
  }): Promise<UserProfile> => {
    const currentFbUser = AuthService.getCurrentUser();
    if (!currentFbUser) {
      throw new Error('Sessão expirada. Autentique-se novamente.');
    }

    setAuthState('AUTH_LOADING');
    try {
      const completed = await completeUserProfile({
        uid: currentFbUser.uid,
        email: currentFbUser.email || profile?.email || '',
        nome: data.nome,
        crea: data.crea,
        empresaId: data.empresaId,
        empresaNome: data.empresaNome,
        existingProfile: profile
      });

      setProfile(completed);
      setUser(mapProfileToUser(completed));
      setAuthState('AUTHENTICATED_PROFILE_COMPLETE');
      return completed;
    } catch (err) {
      setAuthState(profile ? 'AUTHENTICATED_PROFILE_INCOMPLETE' : 'AUTHENTICATED_NO_PROFILE');
      throw err;
    }
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    console.log('[AUTH DEBUG] refreshProfile chamado');
    const currentFbUser = AuthService.getCurrentUser();
    if (!currentFbUser) return null;
    const initStatus = await checkSystemInitialization().catch((err) => {
      console.error('[AUTH DEBUG] erro checkSystemInitialization em refreshProfile:', {
        name: err?.name,
        code: err?.code,
        message: err?.message,
        stack: err?.stack
      });
      return true;
    });
    setSystemInitialized(initStatus);
    return await evaluateUserProfile(currentFbUser);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const currentFbUser = AuthService.getCurrentUser();
    const uid = data.uid || profile?.uid || user?.uid || currentFbUser?.uid || '';
    if (!uid) return;

    const isTransitioningFromPending =
      (profile?.empresaId === 'EMAIL_PENDING' || profile?.empresaId === 'GOOGLE_PENDING' || !profile?.empresaId) &&
      Boolean(data.empresaId && data.empresaId !== 'EMAIL_PENDING' && data.empresaId !== 'GOOGLE_PENDING');

    const targetPerfil = isTransitioningFromPending
      ? (profile?.perfil === 'ADMIN' || profile?.perfil === 'ADMINISTRADOR' ? profile.perfil : 'USUARIO')
      : (data.perfil || profile?.perfil || 'USUARIO');

    const updated: UserProfile = {
      uid,
      email: data.email || profile?.email || user?.email || currentFbUser?.email || '',
      nome: data.nome || profile?.nome || user?.name || '',
      empresaId: data.empresaId || profile?.empresaId || user?.companyId || '',
      empresaNome: data.empresaNome || profile?.empresaNome || user?.companyName || '',
      cargo: data.cargo || profile?.cargo || 'Inspetor',
      tipoLogin: data.tipoLogin || profile?.tipoLogin || 'EMAIL',
      criadoEm: profile?.criadoEm || profile?.dataCriacao || Date.now(),
      dataCriacao: profile?.dataCriacao || profile?.criadoEm || Date.now(),
      ...(profile || {}),
      ...data,
      perfil: targetPerfil,
      ativo: true,
      primeiroAcesso: isTransitioningFromPending ? false : (profile?.primeiroAcesso ?? false),
      atualizadoEm: Date.now(),
      dataAtualizacao: Date.now()
    };

    await saveUserProfile(updated);
    setProfile(updated);
    setUser(mapProfileToUser(updated));
    if (isProfileComplete(updated)) {
      setAuthState('AUTHENTICATED_PROFILE_COMPLETE');
    }
  };

  const value = useMemo(
    () => ({
      authState,
      user,
      profile,
      companyId,
      companyName,
      empresaId: companyId,
      empresaNome: companyName,
      loading,
      isAuthenticated,
      profileComplete,
      authError,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      changePassword,
      completeProfile: completeProfileHandler,
      refreshProfile,
      updateProfile,
      systemInitialized,
      checkingSystemInit
    }),
    [
      authState,
      user,
      profile,
      companyId,
      companyName,
      loading,
      isAuthenticated,
      profileComplete,
      authError,
      evaluateUserProfile,
      systemInitialized,
      checkingSystemInit
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return context;
}
