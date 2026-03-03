import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    subscribeToCourses,
    subscribeToCoursesByTeacherId,
} from '../courses';
import { db } from '../../config/db';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    collectionGroup,
    onSnapshot,
    query,
    where,
} from 'firebase/firestore';

vi.mock('../../config/db', () => ({
    db: {},
}));

vi.mock('../firebaseHelper', () => ({
    mapQuerySnapshot: vi.fn((snapshot) => {
        return snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id }));
    }),
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    collectionGroup: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
}));

describe('courses service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCourses', () => {
        it('should get courses across all classes if no classId is provided', async () => {
            (collectionGroup as any).mockReturnValue('collectionGroupRef');
            const mockDocs = [{ id: '1', data: () => ({ subject: 'Math' }) }];
            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const result = await getCourses();

            expect(collectionGroup).toHaveBeenCalledWith(db, 'courses');
            expect(getDocs).toHaveBeenCalledWith('collectionGroupRef');
            expect(result).toHaveLength(1);
        });

        it('should get courses by classId', async () => {
            (collection as any).mockReturnValue('collectionRef');
            const mockDocs = [{ id: '2', data: () => ({ subject: 'Physics' }) }];
            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const result = await getCourses('class123');

            expect(collection).toHaveBeenCalledWith(db, 'classes', 'class123', 'courses');
            expect(getDocs).toHaveBeenCalledWith('collectionRef');
            expect(result).toHaveLength(1);
        });
    });

    describe('createCourse', () => {
        it('should add a new course', async () => {
            (addDoc as any).mockResolvedValue({ id: 'new-course' });
            const courseData = { subject: 'History' } as any;

            const id = await createCourse('class123', courseData);

            expect(collection).toHaveBeenCalledWith(db, 'classes', 'class123', 'courses');
            expect(addDoc).toHaveBeenCalled();
            expect(id).toBe('new-course');
        });
    });

    describe('updateCourse', () => {
        it('should update an existing course', async () => {
            (doc as any).mockReturnValue('docRef');

            await updateCourse('class1', 'course1', { subject: 'Updated' });

            expect(doc).toHaveBeenCalledWith(db, 'classes', 'class1', 'courses', 'course1');
            expect(updateDoc).toHaveBeenCalledWith('docRef', { subject: 'Updated' });
        });
    });

    describe('deleteCourse', () => {
        it('should delete a course', async () => {
            (doc as any).mockReturnValue('docRef');

            await deleteCourse('class1', 'course1');

            expect(doc).toHaveBeenCalledWith(db, 'classes', 'class1', 'courses', 'course1');
            expect(deleteDoc).toHaveBeenCalledWith('docRef');
        });
    });

    describe('subscribeToCourses', () => {
        it('should call onSnapshot on collectionGroup', () => {
            (collectionGroup as any).mockReturnValue('collectionGroupRef');
            const callback = vi.fn();

            subscribeToCourses(callback);

            expect(collectionGroup).toHaveBeenCalledWith(db, 'courses');
            expect(onSnapshot).toHaveBeenCalledWith('collectionGroupRef', expect.any(Function));
        });
    });

    describe('subscribeToCoursesByTeacherId', () => {
        it('should call onSnapshot with correct query', () => {
            (collectionGroup as any).mockReturnValue('collectionGroupRef');
            (query as any).mockReturnValue('queryRef');
            const callback = vi.fn();

            subscribeToCoursesByTeacherId('teacher1', callback);

            expect(where).toHaveBeenCalledWith('teacherId', '==', 'teacher1');
            expect(query).toHaveBeenCalledWith('collectionGroupRef', undefined); // where returns undefined in mock
            expect(onSnapshot).toHaveBeenCalledWith('queryRef', expect.any(Function));
        });
    });
});
