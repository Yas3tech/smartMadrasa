// Allowed MIME types for homework submissions
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
];

// Allowed file extensions (for UI accept attribute)
export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.zip',
  '.rar',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'fileTooLarge' };
  }

  // Strict check: valid MIME type if present, AND valid extension.
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();

  // 1. If file.type is present, it must be in the allowed list.
  if (file.type && !ALLOWED_FILE_TYPES.includes(file.type)) {
     return { valid: false, error: 'invalidFileType' };
  }

  // 2. Extension must be in the allowed list.
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: 'invalidFileType' };
  }

  return { valid: true };
};
