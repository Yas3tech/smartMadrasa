import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeToClasses } from './classes';
import { onSnapshot, query, where, documentId, collection } from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    getFirestore: vi.fn(),
    collection: vi.fn(() => 'mock-collection'),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(() => 'mock-where'),
    documentId: vi.fn(() => 'mock-documentId'),
    onSnapshot: vi.fn((_queryOrCollection, _callback) => {
      // Return a mock unsubscribe function
      return vi.fn();
    }),
  };
});

// Mock db config
vi.mock('../config/db', () => ({
  db: {},
}));

describe('subscribeToClasses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to all classes when no classIds provided', () => {
    const callback = vi.fn();
    subscribeToClasses(callback);

    expect(collection).toHaveBeenCalledWith(expect.anything(), 'classes');
    expect(query).not.toHaveBeenCalled();
    expect(where).not.toHaveBeenCalled();
    expect(onSnapshot).toHaveBeenCalledWith('mock-collection', expect.any(Function));
  });

  it('should filter by classIds when provided', () => {
    const callback = vi.fn();
    const classIds = ['class1', 'class2'];
    subscribeToClasses(callback, classIds);

    expect(collection).toHaveBeenCalledWith(expect.anything(), 'classes');
    expect(documentId).toHaveBeenCalled();
    expect(where).toHaveBeenCalledWith('mock-documentId', 'in', classIds);
    expect(query).toHaveBeenCalledWith('mock-collection', 'mock-where');
    expect(onSnapshot).toHaveBeenCalledWith('mock-query', expect.any(Function));
  });

  it('should return empty list immediately when classIds is empty array', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToClasses(callback, []);

    expect(callback).toHaveBeenCalledWith([]);
    expect(onSnapshot).not.toHaveBeenCalled();
    expect(unsubscribe).toBeTypeOf('function');
  });
});
