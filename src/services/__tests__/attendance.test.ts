import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getAttendance,
    createAttendance,
    updateAttendance,
    subscribeToAttendance,
    subscribeToAttendanceByStudentIds,
} from '../attendance';
import { db } from '../../config/db';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
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
    collectionGroup: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
}));

describe('attendance service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAttendance', () => {
        it('should get attendance across all users if no studentId is provided', async () => {
            (collectionGroup as any).mockReturnValue('collectionGroupRef');
            const mockDocs = [{ id: '1', data: () => ({ status: 'present' }) }];
            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const result = await getAttendance();

            expect(collectionGroup).toHaveBeenCalledWith(db, 'attendance');
            expect(getDocs).toHaveBeenCalledWith('collectionGroupRef');
            expect(result).toHaveLength(1);
        });

        it('should get attendance by studentId', async () => {
            (collection as any).mockReturnValue('collectionRef');
            const mockDocs = [{ id: '2', data: () => ({ status: 'absent' }) }];
            (getDocs as any).mockResolvedValue({ docs: mockDocs });

            const result = await getAttendance('student123');

            expect(collection).toHaveBeenCalledWith(db, 'users', 'student123', 'attendance');
            expect(getDocs).toHaveBeenCalledWith('collectionRef');
            expect(result).toHaveLength(1);
        });
    });

    describe('createAttendance', () => {
        it('should add a new attendance record', async () => {
            (addDoc as any).mockResolvedValue({ id: 'new-record' });
            const recordData = { status: 'present' } as any;

            const id = await createAttendance('student123', recordData);

            expect(collection).toHaveBeenCalledWith(db, 'users', 'student123', 'attendance');
            expect(addDoc).toHaveBeenCalled();
            expect(id).toBe('new-record');
        });
    });

    describe('updateAttendance', () => {
        it('should update an existing attendance record', async () => {
            (doc as any).mockReturnValue('docRef');

            await updateAttendance('student123', 'record1', 'absent', 'Sick');

            expect(doc).toHaveBeenCalledWith(db, 'users', 'student123', 'attendance', 'record1');
            expect(updateDoc).toHaveBeenCalledWith('docRef', { status: 'absent', justification: 'Sick', isJustified: true });
        });
    });

    describe('subscribeToAttendance', () => {
        it('should call onSnapshot on collectionGroup', () => {
            (collectionGroup as any).mockReturnValue('collectionGroupRef');
            const callback = vi.fn();

            subscribeToAttendance(callback);

            expect(collectionGroup).toHaveBeenCalledWith(db, 'attendance');
            expect(onSnapshot).toHaveBeenCalledWith('collectionGroupRef', expect.any(Function), expect.any(Function));
        });
    });

    describe('subscribeToAttendanceByStudentIds', () => {
        it('should return empty function if studentIds is empty', () => {
            const callback = vi.fn();
            const unsub = subscribeToAttendanceByStudentIds([], callback);
            expect(unsub).toBeTypeOf('function');
            expect(onSnapshot).not.toHaveBeenCalled();
        });

        it('should call onSnapshot with correct query', () => {
            (collectionGroup as any).mockReturnValue('collectionGroupRef');
            (query as any).mockReturnValue('queryRef');
            const callback = vi.fn();

            subscribeToAttendanceByStudentIds(['student1', 'student2'], callback);

            expect(where).toHaveBeenCalledWith('studentId', 'in', ['student1', 'student2']);
            expect(query).toHaveBeenCalledWith('collectionGroupRef', undefined);
            expect(onSnapshot).toHaveBeenCalledWith('queryRef', expect.any(Function));
        });
    });
});
