import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteAllUserData } from '../deleteUserData';
import { db, storage } from '../../config/db';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { deleteUser } from 'firebase/auth';

vi.mock('../../config/db', () => ({
  db: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  listAll: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  deleteUser: vi.fn(),
}));

describe('deleteUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockBatch = {
      delete: vi.fn(),
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(true),
    };
    (writeBatch as any).mockReturnValue(mockBatch);

    (getDocs as any).mockResolvedValue({
      empty: false,
      docs: [{ ref: {} }],
      forEach: vi.fn((cb) => cb({ ref: {} })),
      size: 1,
    });

    (deleteDoc as any).mockResolvedValue(true);

    (listAll as any).mockResolvedValue({
      items: [{ fullPath: 'path1' }],
      prefixes: [],
    });

    (deleteObject as any).mockResolvedValue(true);
    (deleteUser as any).mockResolvedValue(true);
  });

  it('should successfully delete all data for a student', async () => {
    const result = await deleteAllUserData('student123', 'student');

    expect(result.success).toBe(true);

    // Check if relevant collections were queried
    expect(collection).toHaveBeenCalledWith(db, 'grades');
    expect(collection).toHaveBeenCalledWith(db, 'attendance');
    expect(collection).toHaveBeenCalledWith(db, 'homeworkSubmissions');

    // Check if storage was called
    expect(ref).toHaveBeenCalledWith(storage, 'users/student123');
    expect(listAll).toHaveBeenCalled();
    expect(deleteObject).toHaveBeenCalled();
  });

  it('should successfully delete all data for a teacher', async () => {
    const result = await deleteAllUserData('teacher123', 'teacher');

    expect(result.success).toBe(true);

    // Check teacher specific collections
    expect(collection).toHaveBeenCalledWith(db, 'homeworks');
    expect(collection).toHaveBeenCalledWith(db, 'teacherComments');
  });

  it('should return errors if operations fail', async () => {
    // Mock getDocs to throw an error for 'messages'
    (getDocs as any).mockImplementation((q: any) => {
      // It's hard to mock a specific query failure easily without inspecting the arguments,
      // but we can just throw universally for testing error boundaries
      return Promise.reject(new Error('Firestore error'));
    });

    const result = await deleteAllUserData('parent123', 'parent');

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
