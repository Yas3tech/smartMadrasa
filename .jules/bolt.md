## 2025-02-17 - [Nested Loop Optimization in Hooks]

**Learning:** Found a performance bottleneck in `useBulletinGrades` where a nested loop (Students x Courses) checked for grades using `grades.some(...)`. This resulted in O(S*C*G) complexity.
**Action:** Replaced the inner search with a `Set` lookup (O(1)) by pre-processing grades in a single pass O(G). Always prefer pre-computing lookups for nested iterations over large datasets.

## 2025-02-17 - [Cache Key Delimiters]

**Learning:** When creating composite keys for Sets/Maps (e.g. `${id1}-${id2}`), use a delimiter that is unlikely to appear in the IDs themselves (like `::`) to prevent potential collisions (e.g. `1-2` and `3` vs `1` and `2-3`).
**Action:** Use `::` or similar distinct separators for composite keys.

## 2025-02-28 - [Avoiding O(N²) in Data Transformations]

**Learning:** Found an O(N²) anti-pattern inside a `useMemo` block in `useMessages.ts` that maps over `users` and then loops over the same array to find parent's children. Large user arrays would cause severe UI lagging.
**Action:** When filtering or linking related items within an array map over the same dataset, always build a lookup `Map` first (O(N)), so inner lookups are O(1), keeping overall complexity at O(N).

## 2026-03-03 - [O(N²) Optimization in TeacherAttendance]

**Learning:** Found an O(N²) anti-pattern in `TeacherAttendance.tsx` where a function `getAttendanceRecord` was defined in the render loop using `Array.prototype.find()`, and was called both in individual mapping iterations and multiple times during stats calculation using `.filter()`. This creates a severe performance bottleneck when scaling to larger classes.
**Action:** Used `useMemo` to pre-compute an `attendanceMap` (O(N)), transforming all subsequent lookups within the render loop and stats aggregation into O(1) operations, dropping the complexity to O(A + S) where A is the number of attendance records and S is the number of students. Refactored stats calculation to perform a single iteration over the students list instead of multiple `.filter()` passes.
