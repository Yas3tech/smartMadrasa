#!/bin/bash

# Fix test files
sed -i 's/} as any);/} as unknown as ReturnType<typeof vi.mocked>);/' src/hooks/__tests__/useBulletinGrades.test.tsx
sed -i 's/} as any);/} as unknown as ReturnType<typeof vi.mocked>);/' src/hooks/__tests__/useDashboard.test.tsx
sed -i 's/} as any/\} as unknown as ReturnType<typeof vi.mocked>/' src/hooks/__tests__/useDashboard.test.tsx
sed -i 's/mockUser as any } as ReturnType<typeof useAuth>/mockUser as unknown as User } as ReturnType<typeof useAuth>/' src/hooks/__tests__/useDashboard.test.tsx
sed -i 's/\] as any;/\] as unknown as any;/g' src/hooks/__tests__/useDashboard.test.tsx

# Find and replace all `] as any;` remaining in useDashboard
sed -i 's/\] as any/\] as unknown as ReturnType<typeof vi.mocked>/g' src/hooks/__tests__/useDashboard.test.tsx

# Fix DataContext slices again (use intersection without declaring duplicate Parent)
sed -i 's/user as Parent/user as (User \& { childrenIds?: string\[\] })/' src/context/slices/UserContext.tsx
sed -i 's/user as Parent/user as (User \& { childrenIds?: string\[\] })/' src/context/slices/CommunicationContext.tsx
sed -i 's/user as Parent/user as (User \& { childrenIds?: string\[\] })/' src/context/slices/AcademicContext.tsx
sed -i 's/user as Parent/user as (User \& { childrenIds?: string\[\] })/' src/context/slices/PerformanceContext.tsx
