import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTeacherComment,
  batchCreateTeacherComments,
  updateTeacherComment,
  validateTeacherComment,
  deleteTeacherComment,
  subscribeToTeacherCommentsByStudent,
  subscribeToTeacherCommentsByCourseAndPeriod,
  subscribeToTeacherCommentsByTeacher,
  subscribeToTeacherCommentsByPeriod,
} from '../teacherComments';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

vi.mock('../firebaseHelper', () => ({
  getDb: vi.fn(() => ({})),
  mapQuerySnapshot: vi.fn((snapshot) => {
    return snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  }),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  writeBatch: vi.fn(),
}));

describe('teacherComments service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createTeacherComment', () => {
    it('should create a new teacher comment', async () => {
      (addDoc as any).mockResolvedValue({ id: 'new-comment' });

      const catData: any = { content: 'Good' };

      const id = await createTeacherComment(catData);

      expect(addDoc).toHaveBeenCalledWith(undefined, {
        content: 'Good',
        createdAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T10:00:00.000Z',
      });
      expect(id).toBe('new-comment');
    });
  });

  describe('batchCreateTeacherComments', () => {
    it('should create multiple comments in a batch', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(true),
      };
      (writeBatch as any).mockReturnValue(mockBatch);
      (doc as any).mockReturnValue('docRef');

      const comments: any[] = [{ content: 'c1' }, { content: 'c2' }];

      await batchCreateTeacherComments(comments);

      expect(writeBatch).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.set).toHaveBeenCalledWith('docRef', {
        content: 'c1',
        createdAt: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T10:00:00.000Z',
      });
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('updateTeacherComment', () => {
    it('should update a comment', async () => {
      (doc as any).mockReturnValue('docRef');

      await updateTeacherComment('cid', { content: 'updated' });

      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith('docRef', {
        content: 'updated',
        updatedAt: '2023-01-01T10:00:00.000Z',
      });
    });
  });

  describe('validateTeacherComment', () => {
    it('should validate a comment', async () => {
      (doc as any).mockReturnValue('docRef');

      await validateTeacherComment('cid');

      expect(updateDoc).toHaveBeenCalledWith('docRef', {
        isValidated: true,
        validationDate: '2023-01-01T10:00:00.000Z',
        updatedAt: '2023-01-01T10:00:00.000Z',
      });
    });
  });

  describe('deleteTeacherComment', () => {
    it('should delete a comment', async () => {
      (doc as any).mockReturnValue('docRef');

      await deleteTeacherComment('cid');

      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  describe('subscriptions', () => {
    beforeEach(() => {
      (collection as any).mockReturnValue('collectionRef');
      (query as any).mockReturnValue('queryRef');
    });

    it('subscribeToTeacherCommentsByStudent should query correctly', () => {
      const callback = vi.fn();
      subscribeToTeacherCommentsByStudent('stu1', callback);
      expect(where).toHaveBeenCalledWith('studentId', '==', 'stu1');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(onSnapshot).toHaveBeenCalledWith('queryRef', expect.any(Function));
    });

    it('subscribeToTeacherCommentsByCourseAndPeriod should query correctly', () => {
      const callback = vi.fn();
      subscribeToTeacherCommentsByCourseAndPeriod('crs1', 'per1', callback);
      expect(where).toHaveBeenCalledWith('courseId', '==', 'crs1');
      expect(where).toHaveBeenCalledWith('periodId', '==', 'per1');
      expect(onSnapshot).toHaveBeenCalledWith('queryRef', expect.any(Function));
    });

    it('subscribeToTeacherCommentsByTeacher should query correctly', () => {
      const callback = vi.fn();
      subscribeToTeacherCommentsByTeacher('tch1', 'per1', callback);
      expect(where).toHaveBeenCalledWith('teacherId', '==', 'tch1');
      expect(where).toHaveBeenCalledWith('periodId', '==', 'per1');
      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
      expect(onSnapshot).toHaveBeenCalledWith('queryRef', expect.any(Function));
    });

    it('subscribeToTeacherCommentsByPeriod should query correctly', () => {
      const callback = vi.fn();
      subscribeToTeacherCommentsByPeriod('per1', callback);
      expect(where).toHaveBeenCalledWith('periodId', '==', 'per1');
      expect(onSnapshot).toHaveBeenCalledWith('queryRef', expect.any(Function));
    });
  });
});
