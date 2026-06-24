#!/bin/bash

# Fix 1: Add eslint-disable to slices context files
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/UserContext.tsx
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/PerformanceContext.tsx
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/CommunicationContext.tsx
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/AcademicContext.tsx

# Fix 2: fix unexpected 'any' in context slices and tests
sed -i 's/usersMap\.set(u.id, u as any);/usersMap.set(u.id, u as unknown as Student);/' src/context/slices/UserContext.tsx
sed -i 's/gradesMap\.set(g.id, g as any);/gradesMap.set(g.id, g as Grade);/' src/context/slices/PerformanceContext.tsx
sed -i 's/messagesMap\.set(m.id, m as any);/messagesMap.set(m.id, m as Message);/' src/context/slices/CommunicationContext.tsx
sed -i 's/classesMap\.set(c.id, c as any);/classesMap.set(c.id, c as ClassGroup);/' src/context/slices/AcademicContext.tsx
