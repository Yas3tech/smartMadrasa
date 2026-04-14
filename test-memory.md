## 2026-03-03 - [O(N²) Optimization in StudentGradesView]
**Learning:** Found a performance bottleneck in `StudentGradesView.tsx` where an `Array.prototype.find()` lookup over `users` and `courses` was executed inside a `.map()` render loop over `myGrades`. This created an O(G * (U + C)) complexity.
**Action:** Replaced the inner `find()` search with an O(1) `Map.prototype.get()` lookup by pre-computing `teacherMap` and `courseMap` using `useMemo`. Always prefer pre-computing lookup maps outside nested iterations/render loops to improve scaling performance.
