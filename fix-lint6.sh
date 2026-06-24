#!/bin/bash

# Fix 1: Add eslint-disable to slices context files
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/UserContext.tsx
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/PerformanceContext.tsx
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/CommunicationContext.tsx
sed -i '1i /* eslint-disable react-refresh/only-export-components */' src/context/slices/AcademicContext.tsx
