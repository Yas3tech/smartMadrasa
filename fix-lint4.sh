#!/bin/bash
sed -i 's/import type {/import type { Parent, /' src/context/slices/UserContext.tsx
sed -i 's/import type {/import type { Parent, /' src/context/slices/CommunicationContext.tsx
sed -i 's/import type {/import type { Parent, /' src/context/slices/AcademicContext.tsx
sed -i 's/import type {/import type { Parent, /' src/context/slices/PerformanceContext.tsx
