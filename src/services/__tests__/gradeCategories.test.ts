import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createGradeCategory,
    updateGradeCategory,
    deleteGradeCategory,
    subscribeToGradeCategories,
} from '../gradeCategories';
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

vi.mock('../firebaseHelper', () => ({
    getDb: vi.fn(() => ({})), // mock db
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

describe('gradeCategories service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createGradeCategory', () => {
        it('should create a grade category', async () => {
            (addDoc as any).mockResolvedValue({ id: 'new-cat-id' });

            const catData: any = {
                name: 'Homeworks',
                weight: 0.3,
            };

            const id = await createGradeCategory(catData);

            expect(addDoc).toHaveBeenCalledWith(undefined, catData);
            expect(id).toBe('new-cat-id');
        });
    });

    describe('updateGradeCategory', () => {
        it('should update a grade category', async () => {
            (doc as any).mockReturnValue('docRef');

            await updateGradeCategory('cat-id', { weight: 0.4 });

            expect(doc).toHaveBeenCalled();
            expect(updateDoc).toHaveBeenCalledWith('docRef', { weight: 0.4 });
        });
    });

    describe('deleteGradeCategory', () => {
        it('should delete a grade category', async () => {
            (doc as any).mockReturnValue('docRef');

            await deleteGradeCategory('cat-id');

            expect(doc).toHaveBeenCalled();
            expect(deleteDoc).toHaveBeenCalledWith('docRef');
        });
    });

    describe('subscribeToGradeCategories', () => {
        it('should call onSnapshot with the correct query', () => {
            (collection as any).mockReturnValue('collectionRef');
            (query as any).mockReturnValue('queryRef');
            (orderBy as any).mockReturnValue('orderByRef');

            const callback = vi.fn();

            subscribeToGradeCategories(callback);

            expect(orderBy).toHaveBeenCalledWith('name', 'asc');
            expect(query).toHaveBeenCalledWith('collectionRef', 'orderByRef');
            expect(onSnapshot).toHaveBeenCalledWith('queryRef', expect.any(Function));
        });
    });
});
