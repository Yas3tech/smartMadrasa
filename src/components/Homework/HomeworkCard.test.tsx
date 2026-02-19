import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeworkCard from './HomeworkCard';
import type { Homework } from '../../types';

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
  Clock: () => <span data-testid="icon-clock" />,
  Edit2: () => <span data-testid="icon-edit" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Eye: () => <span data-testid="icon-eye" />,
  Send: () => <span data-testid="icon-send" />,
  BookOpen: () => <span data-testid="icon-book" />,
}));

const mockHomework: Homework = {
  id: 'hw-1',
  title: 'Math Homework',
  subject: 'Mathematics',
  description: 'Solve problems 1-10',
  dueDate: '2023-12-31T23:59:59Z',
  assignedBy: 'teacher-1',
  classId: 'class-1',
  allowOnlineSubmission: true,
  maxGrade: 20,
};

describe('HomeworkCard', () => {
  it('renders accessible edit and delete buttons for teachers', () => {
    render(
      <HomeworkCard
        homework={mockHomework}
        status="pending"
        daysRemaining={5}
        isTeacher={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Check for edit button by aria-label
    const editButton = screen.getByRole('button', { name: 'common.edit' });
    expect(editButton).toBeInTheDocument();

    // Check for delete button by aria-label
    const deleteButton = screen.getByRole('button', { name: 'common.delete' });
    expect(deleteButton).toBeInTheDocument();
  });
});
