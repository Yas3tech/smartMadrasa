## 2024-05-22 - [Hooks returning generator functions]
**Learning:** The `useDashboard` hook was returning functions like `getWeeklyAttendanceData` that calculated data on demand. This caused two issues: 1) The functions were recreated on every render, breaking memoization of child components. 2) The calculation happened during render of child components, potentially multiple times.
**Action:** In future hooks, calculate derived data using `useMemo` and return the data arrays directly. This stabilizes references and avoids redundant calculations.

## 2024-05-23 - [Optimizing derived state in hooks]
**Learning:** The `useUsers` hook was recalculating `filteredUsers` and `roleCounts` on every render, causing unnecessary re-renders of the user list and stats cards. This is a common pattern when derived state depends on context data.
**Action:** Use `useMemo` to memoize derived state that depends on context data or local filters. Use single-pass loops for calculating multiple aggregates (like role counts) to reduce complexity from O(kN) to O(N).
