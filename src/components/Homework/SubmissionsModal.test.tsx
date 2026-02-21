import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SubmissionsModal from './SubmissionsModal';
import type { Homework, Submission } from '../../types';
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
  File: () => <span data-testid="icon-file" />,
  Download: () => <span data-testid="icon-download" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
}));

// Mock UI components
vi.mock('../UI', () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Input: () => <input />,
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
};

const mockSubmission: Submission = {
  id: 'sub-1',
  homeworkId: 'hw-1',
  studentId: 'student-1',
  studentName: 'John Doe',
  submittedAt: '2023-12-30T10:00:00Z',
  content: 'Here is my homework',
  files: [
    {
      name: 'safe.pdf',
      url: 'https://example.com/safe.pdf',
      size: 1024,
      type: 'application/pdf',
      uploadedAt: '2023-12-30T10:00:00Z',
    },
    {
      name: 'malicious.js',
      url: 'data:text/html,<script>alert(1)</script>',
      size: 500,
      type: 'text/javascript',
      uploadedAt: '2023-12-30T10:00:00Z',
    },
  ],
};

describe('SubmissionsModal', () => {
  it('renders submission files', () => {
    render(
      <SubmissionsModal
        isOpen={true}
        onClose={vi.fn()}
        homework={mockHomework}
        submissions={[mockSubmission]}
        gradingSubmissionId={null}
        setGradingSubmissionId={vi.fn()}
        gradeValue={0}
        setGradeValue={vi.fn()}
        feedbackValue=""
        setFeedbackValue={vi.fn()}
        onGradeSubmission={vi.fn()}
        formatFileSize={(bytes) => `${bytes} B`}
      />
    );

    // Verify safe link is rendered
    const links = screen.getAllByRole('link');
    const safeLinkFound = links.find((link) => link.getAttribute('href') === 'https://example.com/safe.pdf');
    expect(safeLinkFound).toBeInTheDocument();

    // Verify malicious link is NOT rendered
    const maliciousLinkFound = links.find((link) => link.getAttribute('href') === 'data:text/html,<script>alert(1)</script>');
    expect(maliciousLinkFound).toBeUndefined();

    // Verify warning is displayed
    const warningText = screen.getByText('common.unsafeFile');
    expect(warningText).toBeInTheDocument();
  });
});
