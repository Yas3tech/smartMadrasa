## 2024-05-22 - [Playwright Verification of :focus-visible]
**Learning:** Testing `:focus-visible` styles with Playwright can be tricky in headless mode. `element.focus()` might not trigger `:focus-visible` unless a keyboard interaction (like Tab) is simulated. Also, taking screenshots immediately after focus might capture the state before the ring is fully rendered or if the browser doesn't apply it in that specific context.
**Action:** When verifying focus rings, use `page.keyboard.press("Tab")` to navigate to the element instead of `element.focus()`. Ensure the screenshot is taken after the interaction. Rely on attribute verification (`role`, `tabIndex`) as the primary source of truth for accessibility logic.

## 2024-05-24 - [Accessible File Inputs]
**Learning:** Using `display: none` or `hidden` class on file inputs removes them from the accessibility tree, making them inaccessible to keyboard users and screen readers.
**Action:** Always use the `sr-only` class (visually hidden but accessible) for file inputs. Ensure the custom trigger label or container has focus styles (`focus-within`) to provide visual feedback when the hidden input receives focus. Also, explicitly associate the label with the input using `htmlFor` and `id` (via `useId`), even if the input is nested or visually separated.
