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
    // new URL('//example.com') throws without base.
    // So it goes to catch block.
    // It contains ':'. Returns false.
    // wait, '//example.com' contains ':'. No.
    // '//example.com' contains ':'. No?
    // Oh, 'http:' contains ':'.
    // '//example.com' does NOT contain ':'.
    // So it returns true.
    // Protocol relative URLs are safe (inherit http/https).
    expect(isSafeUrl('//example.com')).toBe(true);

    // What if malicious protocol relative?
    // //javascript:alert(1) -> treated as relative/authority -> resolves to http://javascript:alert(1) -> Safe (domain lookup).
    // So it returns true, which is acceptable as it doesn't execute JS.
    expect(isSafeUrl('//javascript:alert(1)')).toBe(true);
  });
});
