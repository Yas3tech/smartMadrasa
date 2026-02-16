/**
 * scripts/verify_message_rules.js
 * Mocks the Firestore Security Rules logic for message creation to verify the fix for unauthorized public announcements.
 */

console.log('🛡️  Running Security Rule Verification for Messages...\n');

function checkMessageCreateRule(testCase) {
  const { actorRole, actorId, messageData } = testCase;

  // Mocks
  const request = {
    auth: { uid: actorId },
    resource: { data: messageData }
  };

  // Helper functions from rules
  const isAuthenticated = () => request.auth != null;

  // Mock role check (in real rules this fetches from DB)
  const isDirector = () => actorRole === 'director';
  const isSuperAdmin = () => actorRole === 'superadmin';

  // The NEW rule logic we want to test:
  // allow create: if isAuthenticated() && request.resource.data.senderId == request.auth.uid && (
  //   request.resource.data.receiverId != 'all' ||
  //   isDirector() ||
  //   isSuperAdmin()
  // );

  const allowed = isAuthenticated() &&
    request.resource.data.senderId == request.auth.uid &&
    (
      request.resource.data.receiverId != 'all' ||
      isDirector() ||
      isSuperAdmin()
    );

  return allowed;
}

const cases = [
  {
    name: 'Student sends message to another user (allowed)',
    actorRole: 'student',
    actorId: 'student1',
    messageData: { senderId: 'student1', receiverId: 'student2', content: 'Hi' },
    expected: true
  },
  {
    name: 'Student sends message as someone else (DENIED)',
    actorRole: 'student',
    actorId: 'student1',
    messageData: { senderId: 'student2', receiverId: 'student3', content: 'Fake' },
    expected: false
  },
  {
    name: 'Student sends PUBLIC announcement (DENIED)',
    actorRole: 'student',
    actorId: 'student1',
    messageData: { senderId: 'student1', receiverId: 'all', content: 'Hacked!' },
    expected: false
  },
  {
    name: 'Director sends PUBLIC announcement (allowed)',
    actorRole: 'director',
    actorId: 'director1',
    messageData: { senderId: 'director1', receiverId: 'all', content: 'Official' },
    expected: true
  },
  {
    name: 'SuperAdmin sends PUBLIC announcement (allowed)',
    actorRole: 'superadmin',
    actorId: 'admin1',
    messageData: { senderId: 'admin1', receiverId: 'all', content: 'System' },
    expected: true
  },
  {
    name: 'Teacher sends PUBLIC announcement (DENIED by default)',
    actorRole: 'teacher',
    actorId: 'teacher1',
    messageData: { senderId: 'teacher1', receiverId: 'all', content: 'Homework for everyone' },
    expected: false
  }
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const allowed = checkMessageCreateRule(c);

  if (allowed === c.expected) {
    passed++;
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Expected ${c.expected}, got ${allowed})`);
  }
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
