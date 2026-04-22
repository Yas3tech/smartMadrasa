1. **Optimize O(N*M) lookup in `StudentGradesView.tsx`**
   - Replace the unoptimized `getTeacherName` implementation with a map-based O(1) lookup in `src/components/Grades/StudentGradesView.tsx`.
   - Apply the following diff:
   ```git
<<<<<<< SEARCH
  // Filter local grades (already filtered by studentId in hook)
  const myGrades = useMemo(() => {
    // studentGrades is already sorted by date descending in the hook
    if (selectedSubject === 'all') return studentGrades;
    return studentGrades.filter((g) => g.subject === selectedSubject);
  }, [studentGrades, selectedSubject]);

  if (!user || !stats) return null;

  const getTeacherName = (grade: Grade) => {
    if (grade.teacherId) {
      const teacher = users.find((u) => u.id === grade.teacherId);
      if (teacher) return teacher.name;
    }
    const course = courses.find((c) => c.classId === grade.classId && c.subject === grade.subject);
    return course?.teacherName;
  };
=======
  // Filter local grades (already filtered by studentId in hook)
  const myGrades = useMemo(() => {
    // studentGrades is already sorted by date descending in the hook
    if (selectedSubject === 'all') return studentGrades;
    return studentGrades.filter((g) => g.subject === selectedSubject);
  }, [studentGrades, selectedSubject]);

  // Optimization: Pre-compute users Map for O(1) lookups
  const usersMap = useMemo(() => {
    return new Map(users.map((u) => [u.id, u]));
  }, [users]);

  // Optimization: Pre-compute courses Map for O(1) lookups using composite key
  const coursesMap = useMemo(() => {
    return new Map(courses.map((c) => [`${c.classId}::${c.subject}`, c]));
  }, [courses]);

  if (!user || !stats) return null;

  const getTeacherName = (grade: Grade) => {
    if (grade.teacherId) {
      const teacher = usersMap.get(grade.teacherId);
      if (teacher) return teacher.name;
    }
    const course = coursesMap.get(`${grade.classId}::${grade.subject}`);
    return course?.teacherName;
  };
>>>>>>> REPLACE
   ```

2. **Add entry to `.jules/bolt.md`**
   - Execute the following command to log the learning:
   ```bash
   cat << 'EOL' >> .jules/bolt.md

## 2025-03-04 - [O(N²) Optimization in StudentGradesView]
**Learning:** Found an O(N²) anti-pattern in `StudentGradesView.tsx` where `Array.prototype.find()` lookups over `users` and `courses` were executed inside a `getTeacherName` function called within the `myGrades.map()` render loop. This created an O(G * (U + C)) operation during render.
**Action:** Used `useMemo` to pre-compute `usersMap` and `coursesMap` (with a composite key `${classId}::${subject}`) before any early returns, dropping the render complexity for mapping grades to O(G). Always pre-compute lookup maps outside render loops.
EOL
   ```

3. **Verify functionality**
   - Run `pnpm run lint` and `pnpm test:run` to ensure my changes are safe and the rules of hooks are satisfied.

4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**

5. **Create Pull Request**
   - Call the submit tool with the following details:
     - Branch: `bolt/optimize-student-grades-view`
     - Title: `⚡ Bolt: Optimize render loop in StudentGradesView`
     - Description:
       💡 **What**: Replaced `Array.prototype.find()` lookups for users and courses with O(1) `Map.prototype.get()` lookups inside the `myGrades.map()` render loop in `StudentGradesView.tsx`.
       🎯 **Why**: The previous implementation performed a linear search over users and courses for every grade rendered, creating an `O(G * (U + C))` complexity bottleneck as the number of grades, users, and courses grows.
       📊 **Impact**: Drops the render mapping complexity to `O(G)` by pre-computing lookup maps in `O(U + C)` time using `useMemo`. This significantly improves render performance for students with many grades.
       🔬 **Measurement**: Verify by running `pnpm run lint` and `pnpm test:run`. Code inspection confirms the nested loop is eliminated and React hooks rules are respected (hooks placed before early return).
