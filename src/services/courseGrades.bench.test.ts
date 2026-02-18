import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeToCourseGrades, subscribeToCourseGradesByPeriodIds } from './courseGrades';
import type { CourseGrade } from '../types/bulletin';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    getFirestore: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
  };
});

// Mock firebaseHelper
vi.mock('./firebaseHelper', () => {
  return {
    getDb: vi.fn(() => ({})),
    mapQuerySnapshot: vi.fn((snapshot) => {
        const results: any[] = [];
        snapshot.forEach((doc: any) => results.push({ id: doc.id, ...doc.data() }));
        return results;
    }),
  };
});

describe('Course Grades Subscription Benchmark', () => {
  const mockGrades: CourseGrade[] = [];
  const TOTAL_GRADES = 3000;
  const PERIODS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']; // 3 years of 3 periods
  const CURRENT_YEAR_PERIODS = ['p7', 'p8', 'p9'];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGrades.length = 0;

    // Generate 3000 grades distributed across 9 periods
    for (let i = 0; i < TOTAL_GRADES; i++) {
      const periodId = PERIODS[i % PERIODS.length];
      mockGrades.push({
        id: `grade-${i}`,
        studentId: `student-${i % 100}`,
        courseId: `course-${i % 10}`,
        periodId: periodId,
        score: Math.random() * 20,
        maxScore: 20,
        date: new Date().toISOString(),
        categoryId: 'cat-1',
        title: 'Test Grade',
        weight: 1,
        teacherId: 'teacher-1',
      } as CourseGrade);
    }

    // Setup mocks to handle query inspection
    (where as any).mockImplementation((field: string, op: string, val: any) => ({ type: 'where', field, op, val }));
    (query as any).mockImplementation((collectionRef: any, ...constraints: any[]) => ({ type: 'query', constraints }));

    (onSnapshot as any).mockImplementation((q: any, callback: any) => {
        let gradesToReturn = mockGrades;

        // Check for 'where' constraints in the query object
        if (q && q.type === 'query' && q.constraints) {
             const periodFilter = q.constraints.find((c: any) => c.type === 'where' && c.field === 'periodId');
             if (periodFilter && periodFilter.op === 'in') {
                 // Simulate filtering by periodId IN [...]
                 gradesToReturn = mockGrades.filter(g => periodFilter.val.includes(g.periodId));
             }
        }

        const snapshot = {
           forEach: (cb: any) => gradesToReturn.forEach(g => cb({ id: g.id, data: () => g })),
        };
        callback(snapshot);
        return () => {};
    });
  });

  it('subscribeToCourseGrades fetches ALL grades (Baseline)', () => {
    let resultCount = 0;
    subscribeToCourseGrades((grades) => {
      resultCount = grades.length;
    });

    expect(resultCount).toBe(TOTAL_GRADES);
    console.log(`Baseline: Fetched ${resultCount} grades (All History)`);
  });

  it('subscribeToCourseGradesByPeriodIds fetches filtered grades (Optimized)', () => {
    let resultCount = 0;
    // Use the REAL function now
    subscribeToCourseGradesByPeriodIds(CURRENT_YEAR_PERIODS, (grades) => {
      resultCount = grades.length;
    });

    // Expected: 3000 / 9 * 3 = 1000
    const expectedCount = mockGrades.filter(g => CURRENT_YEAR_PERIODS.includes(g.periodId)).length;

    expect(resultCount).toBe(expectedCount);
    console.log(`Optimized: Fetched ${resultCount} grades (Current Year)`);
    console.log(`Improvement: ${(TOTAL_GRADES / resultCount).toFixed(2)}x reduction in document reads`);
  });
});
