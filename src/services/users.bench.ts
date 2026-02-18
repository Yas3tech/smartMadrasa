import { bench, describe, vi } from 'vitest';
import { createUser } from './users';

// Mock config/firebase
vi.mock('../config/firebase', () => ({
  firebaseConfig: { apiKey: 'mock' },
}));

// Mock firebase/app
vi.mock('firebase/app', async () => {
  return {
    initializeApp: vi.fn(() => {
      // Simulate overhead: 5ms busy wait
      const start = performance.now();
      while (performance.now() - start < 5) {
        // busy wait
      }
      return { name: 'SecondaryApp' };
    }),
    deleteApp: vi.fn(),
  };
});

// Mock firebase/auth
vi.mock('firebase/auth', async () => {
  return {
    getAuth: vi.fn(() => ({})),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
    signOut: vi.fn(() => Promise.resolve()),
    sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  };
});

// Mock db (required by users.ts imports)
vi.mock('../config/db', () => ({
  db: {},
}));

// Mock firestore (required by users.ts imports)
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

describe('User Creation Performance', () => {
  bench('createUser (Optimized)', async () => {
    await createUser({ email: 'test@example.com', role: 'student', name: 'Test' });
  });
});
