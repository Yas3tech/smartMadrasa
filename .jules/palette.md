## 2025-02-23 - Improve Form Accessibility
**Learning:** Standard `Input` components often miss programmatic associations between labels, inputs, and error messages, making them inaccessible to screen readers.
**Action:** Use `React.useId()` to auto-generate unique IDs and link elements via `htmlFor`, `aria-describedby`, and `aria-invalid` by default in all form components.
