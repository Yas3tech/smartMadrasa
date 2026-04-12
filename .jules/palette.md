## 2025-02-23 - Improve Form Accessibility

**Learning:** Standard `Input` components often miss programmatic associations between labels, inputs, and error messages, making them inaccessible to screen readers.
**Action:** Use `React.useId()` to auto-generate unique IDs and link elements via `htmlFor`, `aria-describedby`, and `aria-invalid` by default in all form components.

## 2025-05-20 - Icon-only buttons lack accessible names

**Learning:** The `Button` component allows icon-only usage without enforcing an accessible name (via `aria-label` or `children`), leading to inaccessible controls.
**Action:** When using icon-only `Button`, always verify that an `aria-label` is provided, especially for critical actions like "Edit" or "Delete".

## 2024-03-07 - Icon-only Toolbar Buttons Accessibility
**Learning:** Icon-only toolbar buttons often rely solely on the `title` attribute for tooltips, which is insufficient for screen readers and keyboard users. Furthermore, relying on `hover` pseudo-classes for interactivity indication fails to accommodate keyboard navigation.
**Action:** Always ensure icon-only buttons have explicit `aria-label` attributes (often matching the `title`) and use `focus-visible:ring-2 focus-visible:ring-orange-500` (or appropriate thematic color) to provide clear visual feedback for tab-based navigation.

## 2024-05-24 - Interactive Elements Hidden Behind Hover States
**Learning:** Using `opacity-0 group-hover:opacity-100` to hide secondary actions (like delete buttons) until hovered makes those actions completely invisible to keyboard-only users navigating via Tab.
**Action:** When hiding elements visually until hovered, always pair it with `focus-visible:opacity-100` and explicit focus rings (`focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500`) to ensure the element reveals itself when receiving keyboard focus. Furthermore, always provide an `aria-label` or `title` for icon-only action buttons.
