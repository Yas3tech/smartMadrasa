1. **Context**: We identified that the delete buttons in the course cards inside `ScheduleDesktop.tsx` and `ScheduleMobile.tsx` components have `opacity-0` by default, relying on `group-hover:opacity-100` to be visible. This means that users who rely on keyboard navigation cannot see the button when tabbing to it, making it inaccessible. Furthermore, they use a `<Trash2 />` icon without any `aria-label` or `title`, violating WCAG accessibility guidelines.
2. **Action**:
  - Add `focus-visible:opacity-100` to the delete buttons in both `ScheduleDesktop.tsx` and `ScheduleMobile.tsx`.
  - Add `focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500` (or red-500) to ensure keyboard focus visibility.
  - Add `title={t('common.delete')}` and `aria-label={t('common.delete')}` to provide accessible names for screen readers.
