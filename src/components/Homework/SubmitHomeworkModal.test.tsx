import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SubmitHomeworkModal } from './SubmitHomeworkModal';
import type { Homework, SubmissionFile } from '../../types';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock props
const mockHomework: Homework = {
  id: 'hw-1',
  title: 'Math Homework',
  description: 'Solve problems 1-10',
  subject: 'Math',
  classId: 'class-1',
  teacherId: 'teacher-1',
  dueDate: '2024-12-31',
  createdAt: '2024-12-01',
  maxGrade: 20,
  isGraded: true,
  allowOnlineSubmission: true,
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  homework: mockHomework,
  submissionContent: '',
  setSubmissionContent: vi.fn(),
  selectedFiles: [],
  existingFiles: [],
  setExistingFiles: vi.fn(),
  uploadProgress: {},
  uploadingFiles: false,
  onSubmit: vi.fn(),
  onFileSelect: vi.fn(),
  onRemoveFile: vi.fn(),
  formatFileSize: (bytes: number) => `${bytes} B`,
};

describe('SubmitHomeworkModal', () => {
  it('renders correctly', () => {
    render(<SubmitHomeworkModal {...defaultProps} />);
    expect(screen.getByText('Math Homework')).toBeInTheDocument();
    // Use getAllByText because there are two labels (one for title, one for wrapping input)
    // The top label is: homework.attachFiles (homework.maxFileSize)
    expect(screen.getByText(/homework.attachFiles/)).toBeInTheDocument();
  });

  it('has accessible close button', () => {
    render(<SubmitHomeworkModal {...defaultProps} />);
    // Check for close button accessibility
    const closeButton = screen.getByRole('button', { name: 'common.close' });
    expect(closeButton).toBeInTheDocument();
  });

  it('renders accessible remove buttons for existing files', () => {
    const existingFiles: SubmissionFile[] = [
      {
        name: 'old_file.pdf',
        url: 'http://example.com/old.pdf',
        type: 'application/pdf',
        size: 1024,
        path: 'path/to/old.pdf',
        uploadedAt: '2024-12-01',
      },
    ];
    render(<SubmitHomeworkModal {...defaultProps} existingFiles={existingFiles} />);

    const removeButton = screen.getByRole('button', { name: 'common.delete old_file.pdf' });
    expect(removeButton).toBeInTheDocument();
  });

  it('renders accessible remove buttons for selected files', () => {
    const selectedFiles = [new File(['content'], 'new_file.txt', { type: 'text/plain' })];
    render(<SubmitHomeworkModal {...defaultProps} selectedFiles={selectedFiles} />);

    const removeButton = screen.getByRole('button', { name: 'common.delete new_file.txt' });
    expect(removeButton).toBeInTheDocument();
  });

  it('has keyboard accessible file input', () => {
    render(<SubmitHomeworkModal {...defaultProps} />);
    // Query the input by its label text
    const fileInput = screen.getByLabelText('homework.form.attachFileHelp');

    // Check that it is NOT hidden (display: none)
    // sr-only class makes it visually hidden but accessible
    expect(fileInput).toHaveClass('sr-only');
    expect(fileInput).not.toHaveClass('hidden');
  });
});
