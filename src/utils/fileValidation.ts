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

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export interface FileValidationResult {
  valid: boolean;
  error?: 'fileTooLarge' | 'invalidFileType' | 'invalidFileSignature' | 'validationError';
}

/**
 * Validates file signature (magic numbers) to prevent extension spoofing.
 */
const validateFileSignature = async (file: File): Promise<boolean> => {
  // Extension check helpers
  const ext = ('.' + file.name.split('.').pop()?.toLowerCase()) as string;

  // 7. Text files (.txt) - Skip signature check
  if (ext === '.txt') {
    return true;
  }

  // Skip small files (less than 4 bytes) - signature check impossible for binary formats
  if (file.size < 4) return false;

  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    // Read only first 32 bytes is enough for most signatures
    reader.readAsArrayBuffer(file.slice(0, 32));
  });

  const bytes = new Uint8Array(buffer);
  const header = Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  // Signatures
  const signatures = {
    jpeg: 'FFD8FF',
    png: '89504E470D0A1A0A',
    pdf: '25504446', // %PDF
    zip: '504B0304', // ZIP, DOCX, XLSX, PPTX, APK, JAR
    rar: '52617221', // Rar!
    ole: 'D0CF11E0A1B11AE1', // Legacy Office (DOC, XLS, PPT, MSI, MSG)
  };

  // 1. JPEG
  if (ext === '.jpg' || ext === '.jpeg') {
    return header.startsWith(signatures.jpeg);
  }

  // 2. PNG
  if (ext === '.png') {
    return header.startsWith(signatures.png);
  }

  // 3. PDF
  if (ext === '.pdf') {
    return header.startsWith(signatures.pdf);
  }

  // 4. ZIP based formats (ZIP, DOCX, XLSX, PPTX)
  if (['.zip', '.docx', '.xlsx', '.pptx'].includes(ext)) {
    return header.startsWith(signatures.zip);
  }

  // 5. RAR
  if (ext === '.rar') {
    return header.startsWith(signatures.rar);
  }

  // 6. WebP
  if (ext === '.webp') {
    // RIFF .... WEBP
    return (
      header.startsWith('52494646') &&
      Array.from(bytes.slice(8, 12))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase() === '57454250'
    );
  }

  // 7. Legacy Office (DOC, XLS, PPT) - OLE Format
  if (['.doc', '.xls', '.ppt'].includes(ext)) {
    return header.startsWith(signatures.ole);
  }

  // Unknown extension (should be caught by allowed extensions check before this)
  return false;
};

export const validateFile = async (file: File): Promise<FileValidationResult> => {
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

  // 3. Signature verification (Security)
  try {
    const isSignatureValid = await validateFileSignature(file);
    if (!isSignatureValid) {
      return { valid: false, error: 'invalidFileSignature' };
    }
  } catch (error) {
    console.error('File signature check failed:', error);
    return { valid: false, error: 'validationError' };
  }

  return { valid: true };
};
