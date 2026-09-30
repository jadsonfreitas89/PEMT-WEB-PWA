import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'app-checklist-pemt-a996f';
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || 'app-checklist-pemt-a996f.firebaseapp.com';
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || 'app-checklist-pemt-a996f.firebasestorage.app';
  const apiKey = env.VITE_FIREBASE_API_KEY || 'AIzaSyBqAFMemZvCpPeAW9o3wwFeDqHzIMvqHy0';
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || '308572152048';
  const appId = env.VITE_FIREBASE_APP_ID || '1:308572152048:web:1385f034c0104f93212235';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(projectId),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(authDomain),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(storageBucket),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(messagingSenderId),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(appId),
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});

