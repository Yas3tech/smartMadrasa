import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUser } from './users';
import * as firebaseApp from 'firebase/app';

// Mock firebase/app
vi.mock('firebase/app', async () => {
  return {
    initializeApp: vi.fn(() => ({ name: 'SecondaryApp' })),
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

// Mock config/firebase
vi.mock('../config/firebase', () => ({
  firebaseConfig: { apiKey: 'mock' },
}));

// Mock db
vi.mock('../config/db', () => ({
  db: {},
}));

// Mock firestore to avoid actual DB calls
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe('User Service Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the module state if possible, or just rely on the fact that we are testing
    // subsequent calls in the same test run.
    // Note: Since 'secondaryApp' is a module-level variable, it persists across tests in the same file
    // unless we can reset the module. But for this test, checking if initializeApp is called once
    // across multiple calls is exactly what we want.
  });

  it('should initialize secondary app only once across multiple user creations', async () => {
    const user1 = { email: 'test1@example.com', role: 'student', name: 'Test 1' };
    const user2 = { email: 'test2@example.com', role: 'student', name: 'Test 2' };

    // First call
    await createUser(user1);

    // Second call
    await createUser(user2);

    // Verify initializeApp was called exactly once
    // Note: It might have been called 0 times if the module was already loaded and initialized in another test,
    // but typically vitest isolates test files. However, inside this test file, it should be once.
    // Wait, if I run this test in isolation, it should be once.
    // But if other tests ran before this in the same process and imported the module...
    // Vitest runs test files in parallel or isolation usually.

    // Let's check how many times it was called.
    // Since we mock the module, the mock is fresh for this test file.
    expect(firebaseApp.initializeApp).toHaveBeenCalledTimes(1);
    expect(firebaseApp.initializeApp).toHaveBeenCalledWith(expect.anything(), 'SecondaryApp');
  });

  it('should not call deleteApp', async () => {
    const user = { email: 'test3@example.com', role: 'student', name: 'Test 3' };
    await createUser(user);
    expect(firebaseApp.deleteApp).not.toHaveBeenCalled();
  });
});
