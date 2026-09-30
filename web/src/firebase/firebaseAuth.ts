import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { authInstance, firestoreInstance } from './firebaseApp';
import type { User } from '../types/user';

function mapFirebaseUser(user: FirebaseUser | null): User | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email ?? '',
    name: user.displayName ?? '',
    companyId: '',
    companyName: ''
  };
}

async function login(username: string, password: string) {
  if (!authInstance) {
    throw new Error('Firebase não está configurado.');
  }
  
  const email = `${username.trim().toLowerCase()}@pemt.local`;
  console.log(`[AUTH DEBUG] username=${username.trim()} email=${email}`);
  
  try {
    console.log('[AUTH DEBUG] iniciando signIn:');
    const credential = await signInWithEmailAndPassword(authInstance, email, password);
    console.log('[AUTH DEBUG] Firebase Auth sucesso, UID:', credential.user.uid);
    return credential;
  } catch (error: any) {
    console.error('[AUTH DEBUG] Firebase Auth erro:', error.code, error.message);
    throw error;
  }
}

async function changePassword(newPassword: string, currentPassword?: string) {
  if (!authInstance || !authInstance.currentUser) {
    throw new Error('Usuário não autenticado no Firebase.');
  }

  const currentUser = authInstance.currentUser;
  console.log('[FIRST ACCESS DEBUG] iniciando alteração de senha');
  console.log('[FIRST ACCESS DEBUG] Firebase UID:', currentUser.uid);
  console.log('[FIRST ACCESS DEBUG] email:', currentUser.email);

  try {
    console.log('[FIRST ACCESS DEBUG] etapa: updatePassword');
    await updatePassword(currentUser, newPassword);
    console.log('[FIRST ACCESS DEBUG] updatePassword concluído com sucesso');
  } catch (err: any) {
    console.error('[FIRST ACCESS DEBUG] erro em updatePassword:', err.code, err.message);
    if (err.code === 'auth/requires-recent-login' && currentPassword && currentUser.email) {
      console.log('[FIRST ACCESS DEBUG] reautenticando usuário para atualizar senha');
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      console.log('[FIRST ACCESS DEBUG] reautenticação com sucesso, tentando updatePassword novamente');
      await updatePassword(currentUser, newPassword);
    } else {
      throw err;
    }
  }

  // Atualiza primeiroAcesso no Firestore
  if (firestoreInstance) {
    console.log('[FIRST ACCESS DEBUG] etapa: updateFirestoreProfile');
    const userRef = doc(firestoreInstance, 'usuarios', currentUser.uid);
    await setDoc(userRef, {
      primeiroAcesso: false,
      atualizadoEm: Date.now()
    }, { merge: true });
    console.log('[FIRST ACCESS DEBUG] perfil Firestore atualizado (primeiroAcesso: false)');
  }

  return { success: true };
}

async function logout() {
  if (!authInstance) return;
  await signOut(authInstance);
}

function onAuthStateChangedListener(callback: (user: User | null) => void) {
  if (!authInstance) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(authInstance, (firebaseUser) => callback(mapFirebaseUser(firebaseUser)));
}

export default {
  login,
  changePassword,
  logout,
  onAuthStateChanged: onAuthStateChangedListener
};

