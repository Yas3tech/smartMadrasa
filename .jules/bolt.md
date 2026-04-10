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

## 2026-03-03 - [Nested Loop O(N²) Optimization in Dashboard Stats]
**Learning:** Found a severe performance bottleneck in `BulletinDashboard.tsx` where an `Array.prototype.find()` lookup over `periodComments` was executed inside a doubly nested loop (Students x Courses x Comments). This created an O(S*C*K) operation during critical UI rendering for directors computing class validation statistics.
**Action:** Replaced the inner `find()` search with an O(1) `Map.prototype.get()` lookup by pre-computing a `commentMap` in O(K) time using a composite key (`${studentId}::${courseId}`). Always prefer pre-computing lookup maps outside nested iterations, especially in statistics aggregation.

## 2025-03-03 - [Nested Loop O(C*K) Optimization in Bulletin Generation]
**Learning:** Found a performance bottleneck in both `BulletinPreview.tsx` and `pdfGenerator.ts` where an `Array.prototype.find()` lookup over `comments` was executed inside a nested loop mapping over courses. This created an O(C*K) operation during bulletin rendering and PDF generation.
**Action:** Replaced the inner `find()` search with an O(1) `Map.prototype.get()` lookup by pre-computing a `studentPeriodCommentsMap` in O(K) time. Always pre-compute lookup maps before mapping over arrays to resolve related items.

## 2026-03-03 - [Batch Grade Add Optimization]
**Learning:** `Array.prototype.find()` inside `.map()` loops over an array of entities created a hidden O(N * M) complexity which becomes noticeable during batch operations like `addGradesBatch` (where multiple grades lookup students). Additionally, re-parsing strings to `Date` objects inside loops adds high computational overhead.
**Action:** When performing array transformations (`.map()`), always pre-compute search objects using `Map`s for O(1) lookups, and pre-parse slow types (like `Date`s to `.getTime()`) before entering the iteration loop to flatten complexity to O(N + M).

## 2025-03-03 - [O(N²) array lookups in Render Loops]
**Learning:** Found an O(N²) anti-pattern in `StudentGradesView.tsx` where an `Array.prototype.find()` lookup over large `users` and `courses` arrays was executed inside the `.map()` loop that renders user grades. This creates an O(G * (U + C)) bottleneck which slows down UI rendering.
**Action:** Always pre-compute lookup maps (using `useMemo`) before iterating through rendering loops. This brings complexity down to O(G + U + C) while keeping the same logic intact.
