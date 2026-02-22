import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeworkDetailModal from './HomeworkDetailModal';
import type { Homework } from '../../types';
import React from 'react';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'fr',
    },
  }),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  BookOpen: () => <span data-testid="icon-book-open" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  User: () => <span data-testid="icon-user" />,
  FileText: () => <span data-testid="icon-file-text" />,
}));

// Mock UI components
vi.mock('../UI', () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const mockHomework: Homework = {
  id: 'hw-1',
  title: 'Math Homework',
  subject: 'Mathematics',
  description: 'Solve problems',
  dueDate: '2023-12-31T23:59:59Z',
  assignedBy: 'teacher-1',
  classId: 'class-1',
  allowOnlineSubmission: true,
  maxGrade: 20,
  attachments: [
    'https://example.com/safe.pdf',
    'data:text/html,<script>alert(1)</script>'
  ]
};

describe('HomeworkDetailModal', () => {
  it('renders homework attachments', () => {
    render(
      <HomeworkDetailModal
        isOpen={true}
        onClose={vi.fn()}
        homework={mockHomework}
      />
    );

    // Verify safe link is rendered
    const links = screen.getAllByRole('link');
    const safeLinkFound = links.find((link) => link.getAttribute('href') === 'https://example.com/safe.pdf');
    expect(safeLinkFound).toBeInTheDocument();

    // Verify malicious link is NOT rendered
    const maliciousLinkFound = links.find((link) => link.getAttribute('href') === 'data:text/html,<script>alert(1)</script>');
    expect(maliciousLinkFound).toBeUndefined();
  });
});
