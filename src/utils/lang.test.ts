import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredLanguage, storeLanguage, applyLanguageDirection, getLanguageLabel } from './lang';

describe('Language Utilities', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  describe('getStoredLanguage', () => {
    it('should return null if no language is stored', () => {
      expect(getStoredLanguage()).toBeNull();
    });

    it('should return the stored language', () => {
      localStorage.setItem('i18nextLng', 'fr');
      expect(getStoredLanguage()).toBe('fr');
    });
  });

  describe('storeLanguage', () => {
    it('should store the language in localStorage', () => {
      storeLanguage('nl');
      expect(localStorage.getItem('i18nextLng')).toBe('nl');
    });
  });

  describe('applyLanguageDirection', () => {
    it('should set direction to rtl for Arabic', () => {
      applyLanguageDirection('ar');
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');
    });

    it('should set direction to ltr for other languages', () => {
      applyLanguageDirection('en');
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');

      applyLanguageDirection('fr');
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('fr');
    });
  });

  describe('getLanguageLabel', () => {
    it('should return the correct label for known languages', () => {
      expect(getLanguageLabel('fr')).toBe('Français');
      expect(getLanguageLabel('nl')).toBe('Nederlands');
      expect(getLanguageLabel('ar')).toBe('العربية');
    });

    it('should return the language code for unknown languages', () => {
      expect(getLanguageLabel('es')).toBe('es');
      expect(getLanguageLabel('de')).toBe('de');
    });
  });
});
