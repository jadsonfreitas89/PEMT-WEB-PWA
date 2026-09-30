import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseAuthProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { authInstance } from '../../firebase/firebaseApp';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const AuthService = {
  /**
   * Realiza login com E-mail e Senha.
   */
  async login(email: string, password: string): Promise<FirebaseUser> {
    if (!authInstance) {
      throw new Error('Firebase Auth não está inicializado.');
    }
    const credential = await signInWithEmailAndPassword(authInstance, email.trim(), password);
    return credential.user;
  },

  /**
   * Realiza cadastro de novo usuário no Firebase Auth com E-mail, Senha e Nome.
   */
  async register(email: string, password: string, name: string): Promise<FirebaseUser> {
    if (!authInstance) {
      throw new Error('Firebase Auth não está inicializado.');
    }

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    const credential = await createUserWithEmailAndPassword(authInstance, trimmedEmail, password);
    const user = credential.user;

    // Atualiza o displayName no objeto de auth do Firebase
    try {
      await updateFirebaseAuthProfile(user, { displayName: trimmedName });
    } catch (err) {
      console.warn('[Auth] Não foi possível atualizar o displayName no Auth:', err);
    }

    return user;
  },

  /**
   * Realiza login com Google via Popup do Firebase Authentication.
   * Não cria perfil automático para garantir o fluxo de primeiro acesso.
   */
  async loginWithGoogle(): Promise<FirebaseUser> {
    if (!authInstance) {
      throw new Error('Firebase Auth não está inicializado.');
    }

    const credential = await signInWithPopup(authInstance, googleProvider);
    return credential.user;
  },

  /**
   * Envia e-mail de recuperação de senha.
   */
  async resetPassword(email: string): Promise<void> {
    if (!authInstance) {
      throw new Error('Firebase Auth não está inicializado.');
    }
    await sendPasswordResetEmail(authInstance, email.trim());
  },

  /**
   * Realiza logout do usuário.
   */
  async logout(): Promise<void> {
    if (!authInstance) return;
    await signOut(authInstance);
  },

  /**
   * Listener de alteração do estado de autenticação do Firebase.
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    if (!authInstance) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(authInstance, callback);
  },

  /**
   * Obtém o usuário Firebase atual de forma síncrona.
   */
  getCurrentUser(): FirebaseUser | null {
    return authInstance?.currentUser || null;
  }
};

export default AuthService;

