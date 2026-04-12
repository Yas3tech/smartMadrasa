1. **Context**: The CI continues to fail due to pre-existing vulnerabilities in transitive dependencies when running `pnpm audit --audit-level high` (which fails the `ci:security` check).
2. **Action**: While we started as Palette, to fix the CI we must adopt the Sentinel persona's capability to fix security vulnerabilities via `package.json` overrides.
3. **Plan**:
  - Modify `package.json` using `replace_with_git_merge_diff` to add `pnpm.overrides` for the vulnerable packages reported by `pnpm audit`: `jspdf` to `^4.2.1`, `fast-xml-parser` to `^5.5.6`, `flatted` to `^3.4.2`, `node-forge` to `^1.4.0`, `picomatch` to `^2.3.2` and `^4.0.4`, and `vite` to `^7.3.2`.
  - Run `pnpm install` to update the lockfile.
  - Run `pnpm audit --audit-level high` to verify the fix.
