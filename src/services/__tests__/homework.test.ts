import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getHomeworks,
    createHomework,
    updateHomework,
    deleteHomework,
    subscribeToHomeworks,
    subscribeToHomeworksByClassIds,
    getSubmissions,
    submitHomework,
    gradeSubmission,
    updateSubmission,
    subscribeToSubmissions,
} from '../homework';
import { db } from '../../config/db';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
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

vi.mock('../utils/date', () => ({
    formatFirestoreTimestamp: vi.fn((val) => val), // mock simple passthrough
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
}));

describe('homework service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getHomeworks', () => {
        it('should get all homeworks when no classId is provided', async () => {
            const mockDocs = [{ id: '1', data: () => ({ title: 'HW1', dueDate: '2023-10-01' }) }];
            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const result = await getHomeworks();

            expect(query).toHaveBeenCalledWith(undefined, undefined); // collection and orderBy are mocked
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('HW1');
        });

        it('should get homeworks by classId', async () => {
            const mockDocs = [{ id: '2', data: () => ({ title: 'HW2', dueDate: '2023-10-02' }) }];
            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const result = await getHomeworks('class123');

            expect(where).toHaveBeenCalledWith('classId', '==', 'class123');
            expect(result).toHaveLength(1);
        });
    });

    describe('createHomework', () => {
        it('should add a new homework document', async () => {
            (addDoc as any).mockResolvedValue({ id: 'new-id' });
            const hwData = { title: 'New HW' } as any;

            const id = await createHomework(hwData);

            expect(addDoc).toHaveBeenCalled();
            expect(id).toBe('new-id');
        });
    });

    describe('updateHomework', () => {
        it('should update an existing homework', async () => {
            (doc as any).mockReturnValue({});
            await updateHomework('hw-id', { title: 'Updated' });

            expect(doc).toHaveBeenCalledWith(db, 'homeworks', 'hw-id');
            expect(updateDoc).toHaveBeenCalledWith({}, { title: 'Updated' });
        });
    });

    describe('deleteHomework', () => {
        it('should delete a homework', async () => {
            (doc as any).mockReturnValue({});
            await deleteHomework('hw-id');

            expect(doc).toHaveBeenCalledWith(db, 'homeworks', 'hw-id');
            expect(deleteDoc).toHaveBeenCalledWith({});
        });
    });

    describe('getSubmissions', () => {
        it('should get submissions for a homework', async () => {
            const mockDocs = [{ id: 'sub1', data: () => ({ studentId: 'stu1', submittedAt: 'now' }) }];
            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const result = await getSubmissions('hw1');

            expect(collection).toHaveBeenCalledWith(db, 'homeworks', 'hw1', 'submissions');
            expect(result).toHaveLength(1);
            expect(result[0].studentId).toBe('stu1');
        });
    });

    describe('submitHomework', () => {
        it('should create a submission', async () => {
            (addDoc as any).mockResolvedValue({ id: 'sub-new' });
            const sub = { studentId: 'stu1' } as any;

            const id = await submitHomework('hw1', sub);

            expect(addDoc).toHaveBeenCalled();
            expect(id).toBe('sub-new');
        });
    });

    describe('gradeSubmission', () => {
        it('should update grade and feedback', async () => {
            (doc as any).mockReturnValue({});
            await gradeSubmission('hw1', 'sub1', 18, 'Good job');

            expect(doc).toHaveBeenCalledWith(db, 'homeworks', 'hw1', 'submissions', 'sub1');
            expect(updateDoc).toHaveBeenCalledWith({}, { grade: 18, feedback: 'Good job' });
        });
    });
});
