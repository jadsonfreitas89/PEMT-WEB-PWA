import {
  GoogleAuthProvider,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { authInstance } from './firebaseApp';
import { createInitialUserProfile } from './firebaseProfile';
import type { User } from '../types/user';

const provider = new GoogleAuthProvider();

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

async function login(email: string, password: string) {
  if (!authInstance) {
    throw new Error('Firebase não está configurado.');
  }
  return await signInWithEmailAndPassword(authInstance, email.trim(), password);
}

async function register(email: string, password: string, name?: string) {
  if (!authInstance) {
    throw new Error('Firebase não está configurado.');
  }
  const credential = await createUserWithEmailAndPassword(authInstance, email.trim(), password);
  if (name && credential.user) {
    try {
      await updateProfile(credential.user, { displayName: name.trim() });
    } catch {
      // Ignora erro menor de displayName
    }
    await createInitialUserProfile({
      uid: credential.user.uid,
      email: email.trim(),
      nome: name.trim(),
      tipoLogin: 'EMAIL',
      emailVerificado: credential.user.emailVerified
    });
  }
  return credential;
}

async function loginWithGoogle() {
  if (!authInstance) {
    throw new Error('Firebase não está configurado.');
  }
  const credential = await signInWithPopup(authInstance, provider);
  if (credential.user) {
    await createInitialUserProfile({
      uid: credential.user.uid,
      email: credential.user.email || '',
      nome: credential.user.displayName || '',
      tipoLogin: 'GOOGLE',
      fotoPerfil: credential.user.photoURL,
      emailVerificado: credential.user.emailVerified
    });
  }
  return credential;
}

async function resetPassword(email: string) {
  if (!authInstance) {
    throw new Error('Firebase não está configurado.');
  }
  await sendPasswordResetEmail(authInstance, email.trim());
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
  register,
  loginWithGoogle,
  resetPassword,
  logout,
  onAuthStateChanged: onAuthStateChangedListener
};

