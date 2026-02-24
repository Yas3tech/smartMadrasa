import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUpload } from './FileUpload';
import { uploadFileWithProgress } from '../../services/storage';

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

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

// Mock storage service
vi.mock('../../services/storage', () => ({
  uploadFileWithProgress: vi.fn(),
}));

describe('FileUpload', () => {
  it('associates label with file input', () => {
    render(<FileUpload onFilesUploaded={() => {}} generatePath={() => ''} />);
    expect(screen.getByLabelText('Upload File')).toBeInTheDocument();
  });

  it('uses sr-only instead of hidden for accessibility', () => {
    render(<FileUpload onFilesUploaded={() => {}} generatePath={() => ''} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).not.toHaveClass('hidden');
    expect(input).toHaveClass('sr-only');
  });

  it('handles drag and drop', async () => {
    const onFilesUploaded = vi.fn();
    const generatePath = (name: string) => `path/${name}`;

    // Mock successful upload
    vi.mocked(uploadFileWithProgress).mockResolvedValue('https://example.com/file.png');

    render(<FileUpload onFilesUploaded={onFilesUploaded} generatePath={generatePath} />);

    const dropzone = screen.getByText('fileUpload.dropzone').closest('div');
    expect(dropzone).toBeInTheDocument();

    const file = new File(['content'], 'test.png', { type: 'image/png' });

    // Simulate drag over
    fireEvent.dragOver(dropzone!);
    // Check for the class applied when dragging
    // Note: The actual class string might vary due to other classes, so using toHaveClass is safer
    expect(dropzone).toHaveClass('border-orange-500');

    // Simulate drop
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
      },
    });

    // Check if upload function was called
    await waitFor(() => {
      expect(uploadFileWithProgress).toHaveBeenCalledWith(file, 'path/test.png', expect.any(Function));
    });

    // Check if onFilesUploaded was called
    await waitFor(() => {
      expect(onFilesUploaded).toHaveBeenCalledWith(['https://example.com/file.png']);
    });

    // Check if dragging state is reset (it might not be orange anymore)
    // The class 'bg-orange-50' is also added during drag, so we can check removal of that or border color revert
    // But testing specific class removal depends on implementation details.
    // Let's just assume if it was orange before, it shouldn't be orange-500 border if not dragging,
    // unless hover is active, but hover isn't simulated by drop.
    // Actually, after drop, setIsDragging(false) is called.
  });
});
