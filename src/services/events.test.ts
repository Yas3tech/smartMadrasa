import { vi, describe, it, expect, beforeEach } from 'vitest';
import { updateEvent } from './events';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

vi.mock('../config/db', () => ({
  db: {},
}));

describe('updateEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateDoc with correct data including converted timestamps', async () => {
    const id = 'test-id';
    const updates = {
      title: 'New Title',
      start: '2023-01-01T10:00:00.000Z',
      end: '2023-01-01T11:00:00.000Z',
    };

    await updateEvent(id, updates as any);

    expect(doc).toHaveBeenCalledWith(expect.anything(), 'events', id);

    // Check that updateDoc was called with the correct arguments
    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArgs = vi.mocked(updateDoc).mock.calls[0];
    const updateData = updateCallArgs[1] as any;

    expect(updateData.title).toBe('New Title');
    expect(updateData.start).toEqual({ seconds: new Date(updates.start).getTime() / 1000, nanoseconds: 0 });
    expect(updateData.end).toEqual({ seconds: new Date(updates.end).getTime() / 1000, nanoseconds: 0 });
  });

  it('should handle updates without start/end dates', async () => {
    const id = 'test-id';
    const updates = {
      title: 'Just Title',
    };

    await updateEvent(id, updates as any);

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updateCallArgs = vi.mocked(updateDoc).mock.calls[0];
    const updateData = updateCallArgs[1] as any;

    expect(updateData.title).toBe('Just Title');
    expect(updateData.start).toBeUndefined();
    expect(updateData.end).toBeUndefined();
  });
});
