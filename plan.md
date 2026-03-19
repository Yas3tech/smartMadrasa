1. **Optimize `Classes.tsx`**: Replace the `O(N)` lookups inside `classes.map()` with an `O(1)` Map lookup.
   - `getClassTeacher` uses `users.find()`.
   - `getClassStudents` uses `students.filter()`.
   - The map loops over `classes`, so these are repeatedly executed.
   - Pre-compute a `teacherMap` and `classStudentsMap` using `useMemo` before `classes.map()` to reduce the O(N^2) render complexity to O(N).
2. **Complete pre-commit steps**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
3. **Submit**: Create PR.
