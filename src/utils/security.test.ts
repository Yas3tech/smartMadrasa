import { describe, it, expect } from 'vitest';
import { isSafeUrl } from './security';

describe('isSafeUrl', () => {
  it('should allow safe protocols', () => {
    expect(isSafeUrl('http://example.com')).toBe(true);
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('blob:http://localhost:3000/123')).toBe(true);
    expect(isSafeUrl('mailto:user@example.com')).toBe(true);
    expect(isSafeUrl('tel:+1234567890')).toBe(true);
  });

  it('should reject unsafe protocols', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,alert(1)')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeUrl('ftp://example.com')).toBe(false);
  });

  it('should allow relative paths', () => {
    expect(isSafeUrl('/path/to/file.pdf')).toBe(true);
    expect(isSafeUrl('file.pdf')).toBe(true);
    expect(isSafeUrl('path/to/file.pdf')).toBe(true);
    expect(isSafeUrl('../file.pdf')).toBe(true);
    expect(isSafeUrl('#anchor')).toBe(true);
  });

  it('should handle whitespace', () => {
    expect(isSafeUrl(' https://example.com ')).toBe(true);
    expect(isSafeUrl(' javascript:alert(1) ')).toBe(false);
  });

  it('should reject weird schemes that look like relative paths but have colons', () => {
    expect(isSafeUrl('weird:scheme')).toBe(false);
    expect(isSafeUrl('weird:scheme/path')).toBe(false);
  });

  it('should handle case insensitivity', () => {
    expect(isSafeUrl('HTTP://EXAMPLE.COM')).toBe(true);
    expect(isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false);
  });

  it('should reject malicious payloads disguised as safe URLs', () => {
    // javascript: inside query param is safe (server decides)
    expect(isSafeUrl('http://example.com?q=javascript:alert(1)')).toBe(true);

    // protocol-relative URLs starting with //
    expect(isSafeUrl('//example.com')).toBe(true);

    expect(isSafeUrl('//javascript:alert(1)')).toBe(true);
  });

  it('should block payload urls containing control characters and inner spaces', () => {
    expect(isSafeUrl(' \x00 javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('jav\tascript:alert(1)')).toBe(false);
    expect(isSafeUrl('java\x0Bscript:alert(1)')).toBe(false);
    expect(isSafeUrl('\x01javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('javascript :alert(1)')).toBe(false);
    expect(isSafeUrl('javascript\n:alert(1)')).toBe(false);
    expect(isSafeUrl('  javascript:alert(1)  ')).toBe(false);
  });
});
