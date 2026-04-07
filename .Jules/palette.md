## 2025-02-23 - Improve Form Accessibility

**Learning:** Standard `Input` components often miss programmatic associations between labels, inputs, and error messages, making them inaccessible to screen readers.
**Action:** Use `React.useId()` to auto-generate unique IDs and link elements via `htmlFor`, `aria-describedby`, and `aria-invalid` by default in all form components.

## 2025-05-20 - Icon-only buttons lack accessible names

**Learning:** The `Button` component allows icon-only usage without enforcing an accessible name (via `aria-label` or `children`), leading to inaccessible controls.
**Action:** When using icon-only `Button`, always verify that an `aria-label` is provided, especially for critical actions like "Edit" or "Delete".

## 2024-03-07 - Icon-only Toolbar Buttons Accessibility
**Learning:** Icon-only toolbar buttons often rely solely on the `title` attribute for tooltips, which is insufficient for screen readers and keyboard users. Furthermore, relying on `hover` pseudo-classes for interactivity indication fails to accommodate keyboard navigation.
**Action:** Always ensure icon-only buttons have explicit `aria-label` attributes (often matching the `title`) and use `focus-visible:ring-2 focus-visible:ring-orange-500` (or appropriate thematic color) to provide clear visual feedback for tab-based navigation.

## 2025-10-24 - Mobile Icon-only Buttons Accessibility
**Learning:** Mobile views (like `ScheduleMobile`) often use custom icon-only controls for navigation and FABs without underlying accessible names or clear focus states, breaking keyboard and screen reader accessibility on smaller breakpoints.
**Action:** Always verify mobile-specific components add descriptive `aria-label`s and `focus-visible` styles (`focus:outline-none focus-visible:ring-2...`) to all icon buttons, taking care to expose hidden interactive controls via `focus-visible:opacity-100`.
