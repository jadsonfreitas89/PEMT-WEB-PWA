import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { authInstance } from './firebaseApp';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { firebaseApp } from './firebaseApp';
import { createInitialUserProfile } from './firebaseProfile';
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
  const email = `${username.toLowerCase()}@pemt.local`;
  return await signInWithEmailAndPassword(authInstance, email, password);
}

async function changePassword(newPassword: string) {
    const functionsInstance = getFunctions(firebaseApp!);
    const changePasswordFn = httpsCallable<{ newPassword: string }, { success: boolean }>(functionsInstance, 'changePassword');
    return await changePasswordFn({ newPassword });
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

