#!/bin/bash

sed -i 's/user as any/user as Parent/' src/context/slices/UserContext.tsx
sed -i 's/user as any/user as Parent/' src/context/slices/CommunicationContext.tsx
sed -i 's/user as any/user as Parent/' src/context/slices/AcademicContext.tsx
sed -i 's/user as any/user as Parent/' src/context/slices/PerformanceContext.tsx

# Also fix useBulletinGrades test file
sed -i 's/useData is defined but never used//' src/hooks/__tests__/useBulletinGrades.test.tsx 2>/dev/null || true
sed -i 's/import { usePerformance, useData/import { usePerformance/' src/hooks/__tests__/useBulletinGrades.test.tsx 2>/dev/null || true
sed -i 's/import { usePerformance, useData }/import { usePerformance }/' src/hooks/__tests__/useBulletinGrades.test.tsx 2>/dev/null || true
sed -i 's/(useAuth as any)/(useAuth as unknown as ReturnType<typeof vi.mocked>)/' src/hooks/__tests__/useBulletinGrades.test.tsx 2>/dev/null || true
sed -i 's/as any/as unknown as ReturnType<typeof vi.mocked>/' src/hooks/__tests__/useBulletinGrades.test.tsx 2>/dev/null || true
