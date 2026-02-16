import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeToUsers } from './users';
import * as firestore from 'firebase/firestore';

// Mock Firestore
vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(() => 'mock-collection-ref'),
    query: vi.fn(() => 'mock-query-ref'),
    where: vi.fn(() => 'mock-where-constraint'),
    onSnapshot: vi.fn(() => vi.fn()), // Returns unsubscribe function
    doc: vi.fn(),
  };
});

// Mock DB config
vi.mock('../config/db', () => ({
  db: {},
}));

describe('subscribeToUsers Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to all users by default (Baseline)', () => {
    const callback = vi.fn();
    subscribeToUsers(callback);

    expect(firestore.collection).toHaveBeenCalledWith(expect.anything(), 'users');
    // Should NOT call query or where
    expect(firestore.query).not.toHaveBeenCalled();
    expect(firestore.where).not.toHaveBeenCalled();
    expect(firestore.onSnapshot).toHaveBeenCalledWith('mock-collection-ref', expect.any(Function));
  });

  it('optimizes subscription with filters', () => {
    const callback = vi.fn();
    // Passing filters - this signature doesn't exist yet, so TypeScript might complain if we check types.
    // We'll cast to any or ignore TS for this test file as we are changing the signature.

    const filters = [{ role: ['student'] }];
    // @ts-ignore
    subscribeToUsers(callback, filters);

    // Verify that query logic is used
    expect(firestore.collection).toHaveBeenCalledWith(expect.anything(), 'users');
    expect(firestore.query).toHaveBeenCalled();
    expect(firestore.where).toHaveBeenCalledWith('role', 'in', ['student']);

    // onSnapshot should be called with the query result, not the collection directly
    expect(firestore.onSnapshot).toHaveBeenCalledWith('mock-query-ref', expect.any(Function));
  });
});
