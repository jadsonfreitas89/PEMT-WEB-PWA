import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { webcrypto as nodeCrypto } from 'crypto';

if (!globalThis.crypto) {
  (globalThis as any).crypto = nodeCrypto;
}

if (typeof global !== 'undefined' && !(global as any).crypto) {
  (global as any).crypto = nodeCrypto;
}

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
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'PEMT',
          short_name: 'PEMT',
          description: 'Sistema de inspeção de PEMT responsivo e instalável como PWA.',
          theme_color: '#0F172A',
          background_color: '#F8FAFC',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
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
      port: 4173
    }
  };
});

