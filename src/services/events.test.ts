import { vi, describe, it, expect, beforeEach } from 'vitest';
import { updateEvent, getEvents } from './events';
import { updateDoc, doc, getDocs } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      seconds: date.getTime() / 1000,
      nanoseconds: 0,
      toDate: () => date,
      toISOString: () => date.toISOString(),
    })),
  },
}));

vi.mock('../config/db', () => ({
  db: {},
}));

describe('events service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should fetch events and format timestamps correctly', async () => {
      const mockDate = new Date('2023-01-01T10:00:00.000Z');
      const mockTimestamp = {
        toDate: () => mockDate,
      };

      const mockDoc = {
        id: 'event-1',
        data: () => ({
          title: 'Test Event',
          start: mockTimestamp,
          end: mockTimestamp,
        }),
      };

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [mockDoc],
      } as unknown as Awaited<ReturnType<typeof getDocs>>);

      const events = await getEvents();

      expect(getDocs).toHaveBeenCalled();
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('event-1');
      expect(events[0].start).toBe(mockDate.toISOString());
      expect(events[0].end).toBe(mockDate.toISOString());
    });
  });

  describe('updateEvent', () => {
    it('should call updateDoc with correct data including converted timestamps', async () => {
      const id = 'test-id';
      const updates = {
        title: 'New Title',
        start: '2023-01-01T10:00:00.000Z',
        end: '2023-01-01T11:00:00.000Z',
      };

      await updateEvent(id, updates as Parameters<typeof updateEvent>[1]);

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'events', id);

      // Check that updateDoc was called with the correct arguments
      expect(updateDoc).toHaveBeenCalledTimes(1);
      const updateCallArgs = vi.mocked(updateDoc).mock.calls[0];
      const updateData = updateCallArgs[1] as Record<string, unknown>;

      expect(updateData.title).toBe('New Title');
      // Verify Timestamp structure
      expect(updateData.start).toEqual(
        expect.objectContaining({ seconds: new Date(updates.start).getTime() / 1000 })
      );
      expect(updateData.end).toEqual(
        expect.objectContaining({ seconds: new Date(updates.end).getTime() / 1000 })
      );
    });

    it('should handle updates without start/end dates', async () => {
      const id = 'test-id';
      const updates = {
        title: 'Just Title',
      };

      await updateEvent(id, updates as Parameters<typeof updateEvent>[1]);

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const updateCallArgs = vi.mocked(updateDoc).mock.calls[0];
      const updateData = updateCallArgs[1] as Record<string, unknown>;

      expect(updateData.title).toBe('Just Title');
      expect(updateData.start).toBeUndefined();
      expect(updateData.end).toBeUndefined();
    });
  });
});
