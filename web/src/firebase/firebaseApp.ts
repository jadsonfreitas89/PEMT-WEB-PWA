import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFirebaseConfig } from './firebaseConfig';

let firebaseApp: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

const firebaseConfig = getFirebaseConfig();

if (firebaseConfig) {
  console.log('[FIREBASE_RUNTIME_CONFIG]', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    apiKeyConfigured: !!firebaseConfig.apiKey,
    appIdConfigured: !!firebaseConfig.appId
  });

  firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

  authInstance = getAuth(firebaseApp);
  setPersistence(authInstance, browserLocalPersistence).catch(() => {
    // Se a persistência local não estiver disponível, mantém a configuração padrão.
  });
  try {
    firestoreInstance = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true
    });
  } catch {
    firestoreInstance = getFirestore(firebaseApp);
  }
  storageInstance = getStorage(firebaseApp);
}

export { firebaseApp, authInstance, firestoreInstance, storageInstance };
