import { describe, it, expect } from 'vitest';
import { validateFile } from './fileValidation';

describe('validateFile Security Enhancements', () => {
  // Helper to create a file with specific content
  const createMockFile = (content: Uint8Array, name: string, type: string) => {
    return new File([content], name, { type });
  };

  it('should REJECT fake .doc files (vulnerability fixed)', async () => {
    // A text file masquerading as a .doc file
    // Current behavior: .doc files are skipped in signature check, so this should pass
    const content = new TextEncoder().encode('This is not a real doc file');
    const file = createMockFile(content, 'fake.doc', 'application/msword');

    const result = await validateFile(file);

    // Once fixed, this should be false.
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalidFileSignature');
  });

  it('should allow valid .doc files with OLE signature', async () => {
    // OLE Signature: D0 CF 11 E0 A1 B1 1A E1
    const content = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    const file = createMockFile(content, 'real.doc', 'application/msword');

    const result = await validateFile(file);

    expect(result.valid).toBe(true);
  });
});
