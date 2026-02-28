import { describe, it, expect } from 'vitest';
import { validateFile } from './fileValidation';

describe('validateFile', () => {
  // Helper to create a file with specific content
  const createMockFile = (content: Uint8Array, name: string, type: string) => {
    return new File([content], name, { type });
  };

  it('should validate a correct JPEG file', async () => {
    // JPEG signature: FF D8 FF
    const content = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const file = createMockFile(content, 'test.jpg', 'image/jpeg');
    const result = await validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('should validate a correct PNG file', async () => {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const content = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = createMockFile(content, 'test.png', 'image/png');
    const result = await validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('should validate a correct PDF file', async () => {
    // PDF signature: 25 50 44 46
    const content = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const file = createMockFile(content, 'test.pdf', 'application/pdf');
    const result = await validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('should validate a correct ZIP/Office file', async () => {
    // ZIP signature: 50 4B 03 04
    const content = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    const file = createMockFile(content, 'test.zip', 'application/zip');
    const result = await validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('should reject a file with spoofed extension (text file as jpg)', async () => {
    // Text content: "This is a text file"
    const content = new TextEncoder().encode('This is a text file');
    const file = createMockFile(content, 'fake.jpg', 'image/jpeg');
    const result = await validateFile(file);

    // This should fail validation because the signature doesn't match JPEG
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalidFileSignature');
  });

  it('should reject a file exceeding max size', async () => {
    // Create a large file (10MB + 1 byte)
    const content = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = createMockFile(content, 'large.jpg', 'image/jpeg');
    const result = await validateFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('fileTooLarge');
  });
});
