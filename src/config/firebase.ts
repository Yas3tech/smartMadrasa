import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value && value !== 'your-api-key-here' && !value.includes('your-')
);

const isUnsafeProductionConfig = (() => {
  if (!import.meta.env.PROD) return false;
  const projectId = (firebaseConfig.projectId || '').toLowerCase();
  return ['test', 'dev', 'demo', 'staging', 'sandbox'].some((marker) => projectId.includes(marker));
})();

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (isFirebaseConfigured && !isUnsafeProductionConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch {
    // Silent fail
  }
}

export { app, auth, isFirebaseConfigured, isUnsafeProductionConfig, firebaseConfig };
