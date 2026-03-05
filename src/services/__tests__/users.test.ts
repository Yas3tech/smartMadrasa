import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUserWithAllData,
  subscribeToUsers,
  getUserByEmail,
  checkIfDatabaseEmpty,
} from '../users';
import { db } from '../../config/db';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { deleteAllUserData } from '../deleteUserData';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';

vi.mock('../../config/db', () => ({
  db: {},
}));

vi.mock('../firebaseHelper', () => ({
  mapQuerySnapshot: vi.fn((snapshot) => {
    return snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }),
  mapDocumentSnapshot: vi.fn((d: any) => {
    return d.exists() ? { ...d.data(), id: d.id } : null;
  }),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../deleteUserData', () => ({
  deleteAllUserData: vi.fn(),
  previewUserDataDeletion: vi.fn(),
}));

// Mock crypto
vi.stubGlobal('crypto', {
  getRandomValues: vi.fn().mockImplementation((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  randomUUID: vi.fn().mockReturnValue('mock-uuid'),
});

describe('users service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should get all users', async () => {
      (collection as any).mockReturnValue('collectionRef');
      (query as any).mockReturnValue('queryRef');
      const mockDocs = [{ id: '1', data: () => ({ name: 'John' }) }];
      (getDocs as any).mockResolvedValue({ docs: mockDocs });

      const result = await getUsers();

      expect(collection).toHaveBeenCalledWith(db, 'users');
      expect(limit).toHaveBeenCalledWith(500);
      expect(getDocs).toHaveBeenCalledWith('queryRef');
      expect(result).toHaveLength(1);
    });
  });

  describe('checkIfDatabaseEmpty', () => {
    it('should return true if no users exist', async () => {
      (getDocs as any).mockResolvedValue({ empty: true });
      const result = await checkIfDatabaseEmpty();
      expect(result).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return a user if exists', async () => {
      (doc as any).mockReturnValue('docRef');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        id: 'u1',
        data: () => ({ name: 'John' }),
      });

      const result = await getUserById('u1');
      expect(doc).toHaveBeenCalledWith(db, 'users', 'u1');
      expect(result).toEqual({ id: 'u1', name: 'John' });
    });
  });

  describe('getUserByEmail', () => {
    it('should query by email and return first doc', async () => {
      (collection as any).mockReturnValue('collectionRef');
      (where as any).mockReturnValue('whereRef');
      (limit as any).mockReturnValue('limitRef');
      (query as any).mockReturnValue('queryRef');

      const mockDocs = [
        { exists: () => true, id: 'u1', data: () => ({ email: 'test@example.com' }) },
      ];
      (getDocs as any).mockResolvedValue({
        empty: false,
        docs: mockDocs,
      });

      const result = await getUserByEmail('TEST@Example.com  ');

      expect(where).toHaveBeenCalledWith('email', '==', 'test@example.com');
      expect(limit).toHaveBeenCalledWith(1);
      expect(getDocs).toHaveBeenCalledWith('queryRef');
      expect(result).toEqual({ id: 'u1', email: 'test@example.com' });
    });
  });

  describe('createUser', () => {
    it('should create auth account and set doc if email is provided', async () => {
      (createUserWithEmailAndPassword as any).mockResolvedValue({
        user: { uid: 'auth-uid' },
      });
      (sendPasswordResetEmail as any).mockResolvedValue(true);
      (signOut as any).mockResolvedValue(true);

      const firestore = await import('firebase/firestore');
      (firestore.setDoc as any).mockResolvedValue(true);

      const newUser: any = { name: 'John', email: 'john@example.com' };

      const result = await createUser(newUser);

      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(signOut).toHaveBeenCalled();
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: 'John', mustChangePassword: true })
      );

      expect(result).toHaveProperty('uid', 'auth-uid');
    });

    it('should fallback to addDoc if no email is provided', async () => {
      (addDoc as any).mockResolvedValue({ id: 'firestore-uid' });

      const newUser: any = { name: 'NoEmail' };

      const result = await createUser(newUser);

      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: 'NoEmail', mustChangePassword: true })
      );

      expect(result).toBe('firestore-uid');
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      (doc as any).mockReturnValue('docRef');

      await updateUser('u1', { name: 'Updated' });

      expect(doc).toHaveBeenCalledWith(db, 'users', 'u1');
      expect(updateDoc).toHaveBeenCalledWith('docRef', { name: 'Updated' });
    });
  });

  describe('deleteUserWithAllData', () => {
    it('should delegate to deleteAllUserData', async () => {
      (deleteAllUserData as any).mockResolvedValue({
        success: true,
        deletedCounts: {},
        errors: [],
      });

      const result = await deleteUserWithAllData('u1', 'student');

      expect(deleteAllUserData).toHaveBeenCalledWith('u1', 'student');
      expect(result.success).toBe(true);
    });
  });

  describe('subscribeToUsers', () => {
    it('should listen to users collection', () => {
      (collection as any).mockReturnValue('colRef');
      (query as any).mockReturnValue('queryRef');
      const callback = vi.fn();

      subscribeToUsers(callback);

      expect(collection).toHaveBeenCalledWith(db, 'users');
      expect(limit).toHaveBeenCalledWith(500);
      expect(onSnapshot).toHaveBeenCalledWith('queryRef', expect.any(Function));
    });
  });
});
