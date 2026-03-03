import { describe, it, expect, vi } from 'vitest';
import { mapQuerySnapshot, mapDocumentSnapshot } from '../firebaseHelper';
import type { QuerySnapshot, DocumentSnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

// Mock the db to avoid initialization errors
vi.mock('../../config/db', () => ({
    db: {}, // Mock db object
}));

describe('firebaseHelper', () => {
    describe('mapQuerySnapshot', () => {
        it('should map a QuerySnapshot to an array of objects, adding the id', () => {
            const mockDocs = [
                { id: 'id1', data: () => ({ name: 'Test 1', value: 10 }) },
                { id: 'id2', data: () => ({ name: 'Test 2', value: 20 }) },
            ] as unknown as QueryDocumentSnapshot<DocumentData>[];

            const mockSnapshot = { docs: mockDocs } as unknown as QuerySnapshot<DocumentData>;

            const result = mapQuerySnapshot(mockSnapshot);

            expect(result).toHaveLength(2);
            expect(result).toEqual([
                { id: 'id1', name: 'Test 1', value: 10 },
                { id: 'id2', name: 'Test 2', value: 20 },
            ]);
        });

        it('should apply the transform function if provided', () => {
            const mockDocs = [
                { id: 'id1', data: () => ({ dateString: '2023-01-01' }) },
            ] as unknown as QueryDocumentSnapshot<DocumentData>[];

            const mockSnapshot = { docs: mockDocs } as unknown as QuerySnapshot<DocumentData>;

            const transform = (data: DocumentData) => ({
                parsedDate: new Date(data.dateString).getTime(),
            });

            const result = mapQuerySnapshot(mockSnapshot, transform);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: 'id1',
                dateString: '2023-01-01',
                parsedDate: new Date('2023-01-01').getTime(),
            });
        });

        it('should handle an empty QuerySnapshot', () => {
            const mockSnapshot = { docs: [] } as unknown as QuerySnapshot<DocumentData>;
            const result = mapQuerySnapshot(mockSnapshot);
            expect(result).toEqual([]);
        });
    });

    describe('mapDocumentSnapshot', () => {
        it('should map a DocumentSnapshot to an object, adding the id', () => {
            const mockDocSnap = {
                exists: () => true,
                id: 'id1',
                data: () => ({ name: 'Test 1', value: 10 }),
            } as unknown as DocumentSnapshot<DocumentData>;

            const result = mapDocumentSnapshot(mockDocSnap);

            expect(result).toEqual({ id: 'id1', name: 'Test 1', value: 10 });
        });

        it('should apply the transform function if provided', () => {
            const mockDocSnap = {
                exists: () => true,
                id: 'id1',
                data: () => ({ dateString: '2023-01-01' }),
            } as unknown as DocumentSnapshot<DocumentData>;

            const transform = (data: DocumentData) => ({
                parsedDate: new Date(data.dateString).getTime(),
            });

            const result = mapDocumentSnapshot(mockDocSnap, transform);

            expect(result).toEqual({
                id: 'id1',
                dateString: '2023-01-01',
                parsedDate: new Date('2023-01-01').getTime(),
            });
        });

        it('should return null if the document does not exist', () => {
            const mockDocSnap = {
                exists: () => false,
            } as unknown as DocumentSnapshot<DocumentData>;

            const result = mapDocumentSnapshot(mockDocSnap);
            expect(result).toBeNull();
        });
    });
});
