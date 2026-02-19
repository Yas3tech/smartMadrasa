import { describe, it, expect } from 'vitest';
import { generateSecurePassword } from './users';

describe('generateSecurePassword', () => {
  it('should generate a password of at least 12 characters', () => {
    const password = generateSecurePassword();
    expect(password.length).toBeGreaterThanOrEqual(12);
  });

  it('should contain at least one uppercase letter', () => {
    const password = generateSecurePassword();
    expect(password).toMatch(/[A-Z]/);
  });

  it('should contain at least one lowercase letter', () => {
    const password = generateSecurePassword();
    expect(password).toMatch(/[a-z]/);
  });

  it('should contain at least one number', () => {
    const password = generateSecurePassword();
    expect(password).toMatch(/[0-9]/);
  });

  it('should contain at least one special character', () => {
    const password = generateSecurePassword();
    expect(password).toMatch(/[!@#$%^&*()_+]/);
  });

  it('should generate different passwords on consecutive calls', () => {
    const pw1 = generateSecurePassword();
    const pw2 = generateSecurePassword();
    expect(pw1).not.toBe(pw2);
  });
});
