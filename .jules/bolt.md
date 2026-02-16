## 2024-05-22 - [Hooks returning generator functions]
**Learning:** The `useDashboard` hook was returning functions like `getWeeklyAttendanceData` that calculated data on demand. This caused two issues: 1) The functions were recreated on every render, breaking memoization of child components. 2) The calculation happened during render of child components, potentially multiple times.
**Action:** In future hooks, calculate derived data using `useMemo` and return the data arrays directly. This stabilizes references and avoids redundant calculations.
