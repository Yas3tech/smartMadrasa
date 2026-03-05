import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  subscribeToAnnouncements,
} from '../announcements';
import { db } from '../../config/db';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

vi.mock('../../config/db', () => ({
  db: {},
}));

vi.mock('../firebaseHelper', () => ({
  mapQuerySnapshot: vi.fn((snapshot, transform) => {
    return snapshot.docs.map((d: any) => {
      const data = d.data();
      return transform ? { ...data, id: d.id, ...transform(data) } : { ...data, id: d.id };
    });
  }),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe('announcements service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createAnnouncement', () => {
    it('should create an announcement with the current date', async () => {
      (addDoc as any).mockResolvedValue({ id: 'new-id' });

      const announcementData: any = {
        title: 'New Announcement',
        content: 'Content here',
      };

      const id = await createAnnouncement(announcementData);

      expect(addDoc).toHaveBeenCalledWith(
        undefined, // collection(db, 'announcements') returns undefined because it's a mock
        { ...announcementData, date: '2023-01-01T10:00:00.000Z' }
      );
      expect(id).toBe('new-id');
    });
  });

  describe('updateAnnouncement', () => {
    it('should update an announcement', async () => {
      (doc as any).mockReturnValue('docRef');

      await updateAnnouncement('ann-id', { title: 'Updated Title' });

      expect(doc).toHaveBeenCalledWith(db, 'announcements', 'ann-id');
      expect(updateDoc).toHaveBeenCalledWith('docRef', { title: 'Updated Title' });
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete an announcement', async () => {
      (doc as any).mockReturnValue('docRef');

      await deleteAnnouncement('ann-id');

      expect(doc).toHaveBeenCalledWith(db, 'announcements', 'ann-id');
      expect(deleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  describe('subscribeToAnnouncements', () => {
    it('should call onSnapshot with the correct query', () => {
      (collection as any).mockReturnValue('collectionRef');
      (query as any).mockReturnValue('queryRef');
      (orderBy as any).mockReturnValue('orderByRef');

      const callback = vi.fn();

      subscribeToAnnouncements(callback);

      expect(collection).toHaveBeenCalledWith(db, 'announcements');
      expect(orderBy).toHaveBeenCalledWith('date', 'desc');
      expect(query).toHaveBeenCalledWith('collectionRef', 'orderByRef');
      expect(onSnapshot).toHaveBeenCalledWith('queryRef', expect.any(Function));
    });
  });
});
