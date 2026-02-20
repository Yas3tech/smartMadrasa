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

  const trimmed = url.trim();

  // Allow relative URLs starting with / or #
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    // Whitelist allowed protocols
    return ['http:', 'https:', 'blob:', 'mailto:', 'tel:'].includes(protocol);
  } catch (e) {
    // If URL parsing fails, check if it looks like a relative path (no protocol)
    // If it contains a colon, it might be a weird scheme that URL() failed on but browser might accept?
    // Or just a filename with a colon (invalid on Windows but maybe valid on Linux/Mac).
    // To be safe, we reject if it contains a colon (unless it's a port, but URL() handles ports).
    // Actually, "file.txt" is safe. "javascript:alert(1)" contains a colon.
    // If URL() throws, it's not a valid absolute URL.
    // So if it contains ':', treat as unsafe (could be 'javascript:...' that URL() failed on? unlikely).
    // But 'javascript:' is parsed correctly by URL().

    // So if URL() throws, it's likely a relative path or invalid.
    // If it contains ':', it's suspicious if not parsed as URL.
    if (trimmed.includes(':')) return false;

    return true; // Treat as relative path
  }
};
