/**
 * Security utilities
 */

/**
 * Checks if a URL is safe to be used in an href attribute or rendered as a link.
 * Allows http, https, blob, mailto, tel.
 * Allows relative URLs (starting with /, #).
 * Rejects javascript:, data:, vbscript:, and other schemes.
 */
export const isSafeUrl = (url: string): boolean => {
  if (!url) return false;

  // Remove control characters and whitespace which might bypass validation
  // Browsers ignore these when parsing URLs
  // eslint-disable-next-line no-control-regex
  const sanitized = url.replace(/[\x00-\x20\s]+/g, '');

  if (!sanitized) return false;

  // Allow relative URLs starting with / or #
  if (sanitized.startsWith('/') || sanitized.startsWith('#')) return true;

  try {
    const parsed = new URL(sanitized);
    const protocol = parsed.protocol.toLowerCase();

    // Whitelist allowed protocols
    return ['http:', 'https:', 'blob:', 'mailto:', 'tel:'].includes(protocol);
  } catch {
    // If URL parsing fails, check if it looks like a relative path (no protocol)
    // If it contains a colon, it's suspicious and should be rejected
    if (sanitized.includes(':')) return false;

    return true; // Treat as relative path
  }
};
