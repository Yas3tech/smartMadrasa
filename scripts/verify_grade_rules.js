// scripts/verify_grade_rules.js

// Mock data
const teacher = {
  uid: 'teacher1',
  role: 'teacher',
  classIds: ['classA', 'classB']
};

const director = {
  uid: 'director1',
  role: 'director'
};

const otherTeacher = {
  uid: 'teacher2',
  role: 'teacher',
  classIds: ['classC']
};

// Mock Helper Functions
function getMockAuth(user) {
  return { auth: { uid: user.uid } };
}

function getMockUserData(user) {
  return user;
}

function isTeacher(user) {
  return user.role === 'teacher';
}

function isDirector(user) {
  return user.role === 'director';
}

function isValidGrade(request) {
  const score = request.resource.data.score;
  const max = request.resource.data.maxScore;
  return score >= 0 && score <= max;
}

// Vulnerable Rule Logic
function checkVulnerableRule(user, gradeData) {
  const request = { resource: { data: gradeData } };

  // Vulnerable rule: allow write: if (isTeacher() || isDirector()) && isValidGrade();
  const allowed = (isTeacher(user) || isDirector(user)) && isValidGrade(request);
  return allowed;
}

// Fixed Rule Logic
function checkFixedRule(user, gradeData) {
  const request = { resource: { data: gradeData } };
  const userData = getMockUserData(user);

  // Proposed Fix:
  // allow write: if (isDirector() || (isTeacher() && request.resource.data.classId in getUserData().classIds)) && isValidGrade();

  // Note: in firestore rules 'in' operator checks if value is in list.
  // request.resource.data.classId in getUserData().classIds

  let isTeacherAuthorized = false;
  if (isTeacher(user)) {
    // Check if classId is in user's classIds
    // We assume getUserData().classIds exists for teachers as per schema
    if (userData.classIds && userData.classIds.includes(request.resource.data.classId)) {
      isTeacherAuthorized = true;
    }
  }

  const isDirectorAuthorized = isDirector(user);

  const allowed = (isDirectorAuthorized || isTeacherAuthorized) && isValidGrade(request);
  return allowed;
}

// Test Cases
const testCases = [
  {
    name: 'Teacher writes grade for assigned class',
    user: teacher,
    gradeData: { classId: 'classA', score: 10, maxScore: 20 },
    expectedVulnerable: true,
    expectedFixed: true
  },
  {
    name: 'Teacher writes grade for UNASSIGNED class',
    user: teacher,
    gradeData: { classId: 'classC', score: 10, maxScore: 20 },
    expectedVulnerable: true, // Vulnerability: Allows write!
    expectedFixed: false // Fixed: Denies write!
  },
  {
    name: 'Director writes grade',
    user: director,
    gradeData: { classId: 'classC', score: 10, maxScore: 20 },
    expectedVulnerable: true,
    expectedFixed: true
  },
  {
    name: 'Teacher writes invalid grade (score > max)',
    user: teacher,
    gradeData: { classId: 'classA', score: 25, maxScore: 20 },
    expectedVulnerable: false,
    expectedFixed: false
  },
  {
     name: 'Other Teacher writes to class C (assigned)',
     user: otherTeacher,
     gradeData: { classId: 'classC', score: 15, maxScore: 20 },
     expectedVulnerable: true,
     expectedFixed: true
  },
  {
     name: 'Other Teacher writes to class A (unassigned)',
     user: otherTeacher,
     gradeData: { classId: 'classA', score: 15, maxScore: 20 },
     expectedVulnerable: true, // Vulnerability
     expectedFixed: false
  }
];

console.log('🛡️  Verifying Grade Security Rules Logic...\n');

let passed = true;

testCases.forEach(tc => {
  const vulnResult = checkVulnerableRule(tc.user, tc.gradeData);
  const fixedResult = checkFixedRule(tc.user, tc.gradeData);

  const vulnMatch = vulnResult === tc.expectedVulnerable;
  const fixedMatch = fixedResult === tc.expectedFixed;

  if (vulnMatch && fixedMatch) {
    console.log(`✅ ${tc.name}: PASSED`);
  } else {
    passed = false;
    console.error(`❌ ${tc.name}: FAILED`);
    if (!vulnMatch) console.error(`   Vulnerable Rule: Got ${vulnResult}, Expected ${tc.expectedVulnerable}`);
    if (!fixedMatch) console.error(`   Fixed Rule:      Got ${fixedResult}, Expected ${tc.expectedFixed}`);
  }
});

if (!passed) {
  console.error('\nSome tests failed.');
  process.exit(1);
} else {
  console.log('\nAll tests passed. Logic verified.');
}
