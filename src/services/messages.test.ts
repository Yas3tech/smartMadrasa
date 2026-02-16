import { vi, describe, it, expect, beforeEach } from 'vitest';
import { subscribeToMessages } from './messages';
import { query, where, or, orderBy, onSnapshot, collection } from 'firebase/firestore';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  or: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
  },
}));

vi.mock('../config/db', () => ({
  db: {},
}));

vi.mock('../utils/date', () => ({
  normalizeDate: (d: unknown) => d,
  formatFirestoreDate: (d: unknown) => d,
}));

vi.mock('../utils/dateUtils', () => ({
  formatFirestoreTimestamp: (d: unknown) => d,
}));

describe('subscribeToMessages Performance & Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use optimized query when userId is provided', () => {
    const userId = 'user123';
    const callback = vi.fn();

    subscribeToMessages(callback, userId);

    expect(collection).toHaveBeenCalled();
    expect(query).toHaveBeenCalled();

    // Check if 'or' and 'where' were called correctly
    expect(or).toHaveBeenCalled();
    expect(where).toHaveBeenCalledWith('senderId', '==', userId);
    expect(where).toHaveBeenCalledWith('receiverId', 'in', [userId, 'all']);

    // Ensure orderBy is NOT called
    expect(orderBy).not.toHaveBeenCalled();
  });

  it('should fallback to default query when userId is NOT provided', () => {
    const callback = vi.fn();

    subscribeToMessages(callback);

    expect(or).not.toHaveBeenCalled();
    // orderBy was removed from default path too
    expect(orderBy).not.toHaveBeenCalled();
  });

  it('should sort messages client-side correctly', () => {
    const userId = 'user123';
    const callback = vi.fn();

    // Mock onSnapshot to immediately invoke callback with mock data
    vi.mocked(onSnapshot).mockImplementation((q, snapshotCallback) => {
      const mockDocs = [
        { id: '1', data: () => ({ timestamp: '2023-01-01T10:00:00Z', content: 'Old' }) },
        { id: '2', data: () => ({ timestamp: '2023-01-02T10:00:00Z', content: 'New' }) },
        { id: '3', data: () => ({ timestamp: '2023-01-01T12:00:00Z', content: 'Middle' }) },
      ];

      // Pass the mock snapshot
      snapshotCallback({ docs: mockDocs } as unknown as Parameters<typeof snapshotCallback>[0]);
      return () => { };
    });

    subscribeToMessages(callback, userId);

    expect(callback).toHaveBeenCalled();
    const messages = callback.mock.calls[0][0];

    // Expect messages to be sorted by timestamp DESC
    expect(messages[0].content).toBe('New');
    expect(messages[1].content).toBe('Middle');
    expect(messages[2].content).toBe('Old');
  });
});
