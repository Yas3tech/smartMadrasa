## 2025-02-23 - Improve Form Accessibility

**Learning:** Standard `Input` components often miss programmatic associations between labels, inputs, and error messages, making them inaccessible to screen readers.
**Action:** Use `React.useId()` to auto-generate unique IDs and link elements via `htmlFor`, `aria-describedby`, and `aria-invalid` by default in all form components.

## 2025-05-20 - Icon-only buttons lack accessible names

**Learning:** The `Button` component allows icon-only usage without enforcing an accessible name (via `aria-label` or `children`), leading to inaccessible controls.
**Action:** When using icon-only `Button`, always verify that an `aria-label` is provided, especially for critical actions like "Edit" or "Delete".

## 2024-03-07 - Icon-only Toolbar Buttons Accessibility
**Learning:** Icon-only toolbar buttons often rely solely on the `title` attribute for tooltips, which is insufficient for screen readers and keyboard users. Furthermore, relying on `hover` pseudo-classes for interactivity indication fails to accommodate keyboard navigation.
**Action:** Always ensure icon-only buttons have explicit `aria-label` attributes (often matching the `title`) and use `focus-visible:ring-2 focus-visible:ring-orange-500` (or appropriate thematic color) to provide clear visual feedback for tab-based navigation.
## 2024-05-19 - Add Focus Rings to Buttons
**Learning:** Shared UI components lacking explicit `focus-visible` states make keyboard navigation significantly harder across the entire application. Centralizing these styles in base components ensures uniform accessibility.
**Action:** Always ensure interactive elements (like `Button`) have distinct `focus-visible` styles with appropriate offsets to remain visible on various backgrounds.
