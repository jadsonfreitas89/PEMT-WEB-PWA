import type { FirebaseOptions } from 'firebase/app';

// Configurações padrão e canônicas do projeto Firebase PEMT (espelho do google-services.json do Android)
export const DEFAULT_FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyBqAFMemZvCpPeAW9o3wwFeDqHzIMvqHy0",
  authDomain: "app-checklist-pemt-a996f.firebaseapp.com",
  projectId: "app-checklist-pemt-a996f",
  storageBucket: "app-checklist-pemt-a996f.firebasestorage.app",
  messagingSenderId: "308572152048",
  appId: "1:308572152048:web:1385f034c0104f93212235"
};

export function getFirebaseConfig(): FirebaseOptions {
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || DEFAULT_FIREBASE_CONFIG.apiKey;
  const authDomain = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || DEFAULT_FIREBASE_CONFIG.authDomain;
  const projectId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || DEFAULT_FIREBASE_CONFIG.projectId;
  const storageBucket = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || DEFAULT_FIREBASE_CONFIG.storageBucket;
  const messagingSenderId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || DEFAULT_FIREBASE_CONFIG.messagingSenderId;
  const appId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || DEFAULT_FIREBASE_CONFIG.appId;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  };
}


