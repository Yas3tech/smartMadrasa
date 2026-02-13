## 2024-05-23 - React useMemo Dependencies
**Learning:** The `react-hooks/exhaustive-deps` rule flags "unnecessary dependency" if a variable is in the dependency array but not used in the callback, even if it's there intentionally to force updates (e.g. `todayDate`).
**Action:** Always use the dependency variable inside the `useMemo` callback to make the dependency explicit and satisfy the linter. For example, pass `todayDate` to `new Date(todayDate)` instead of `new Date()`.
