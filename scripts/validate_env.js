/**
 * Validates runtime environment variables before production deployment.
 * Usage:
 *   node scripts/validate_env.js production
 */

const mode = process.argv[2] || 'development';

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const env = process.env;
const missing = required.filter((key) => !env[key] || env[key].trim() === '');

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  for (const key of missing) console.error(`- ${key}`);
  process.exit(1);
}

if (mode === 'production') {
  const projectId = env.VITE_FIREBASE_PROJECT_ID.toLowerCase();
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN.toLowerCase();

  const bannedMarkers = ['test', 'dev', 'demo', 'staging', 'sandbox'];
  const hasBannedMarker = bannedMarkers.some(
    (marker) => projectId.includes(marker) || authDomain.includes(marker)
  );

  if (hasBannedMarker) {
    console.error(
      'Production validation failed: Firebase project appears non-production (contains test/dev/demo/staging/sandbox).'
    );
    process.exit(1);
  }
}

console.log(`Environment validation passed for mode: ${mode}`);
