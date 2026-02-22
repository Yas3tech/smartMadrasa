import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUpload } from './FileUpload';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'fileUpload.label') return 'Upload File';
      if (key === 'common.delete') return 'Delete';
      return key;
    },
  }),
}));

describe('FileUpload', () => {
  it('associates label with file input', () => {
    render(<FileUpload onFilesUploaded={() => {}} generatePath={() => ''} />);

    // This should fail because currently the label is not associated with the input
    expect(screen.getByLabelText('Upload File')).toBeInTheDocument();
  });

  it('uses sr-only instead of hidden for accessibility', () => {
    render(<FileUpload onFilesUploaded={() => {}} generatePath={() => ''} />);

    // We find the input directly since getByLabelText might fail
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();

    // Should verify it is NOT hidden (display: none)
    expect(input).not.toHaveClass('hidden');
    // Should verify it has sr-only class
    expect(input).toHaveClass('sr-only');
  });
});
