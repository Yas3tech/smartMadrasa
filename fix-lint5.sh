#!/bin/bash

# Fix 1: Add eslint-disable to slices context files
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/UserContext.tsx
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/PerformanceContext.tsx
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/CommunicationContext.tsx
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/AcademicContext.tsx

# Fix 2: fix unexpected 'any' in context slices
sed -i 's/user as any/user as (User \& { childrenIds?: string\[\] })/' src/context/slices/UserContext.tsx
sed -i 's/user as any/user as (User \& { childrenIds?: string\[\] })/' src/context/slices/CommunicationContext.tsx
sed -i 's/user as any/user as (User \& { childrenIds?: string\[\] })/' src/context/slices/AcademicContext.tsx
sed -i 's/user as any/user as (User \& { childrenIds?: string\[\] })/' src/context/slices/PerformanceContext.tsx
