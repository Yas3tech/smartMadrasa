function checkCommentUpdate(testCase, useFix = false) {
  const { actorRole, actorId, oldData, newData } = testCase;

  const request = {
    auth: { uid: actorId },
    resource: { data: newData }
  };
  const resource = { data: oldData };

  const isAuthenticated = () => true;
  const isDirector = () => actorRole === 'director';
  const isSuperAdmin = () => actorRole === 'superadmin';
  const isTeacher = () => actorRole === 'teacher';

  if (!useFix) {
      return isAuthenticated() && (
        (isTeacher() && resource.data.teacherId == request.auth.uid) ||
        isDirector() ||
        isSuperAdmin()
      );
  } else {
      return isAuthenticated() && (
        (isTeacher() && resource.data.teacherId == request.auth.uid &&
         request.resource.data.teacherId == resource.data.teacherId &&
         request.resource.data.studentId == resource.data.studentId) ||
        isDirector() ||
        isSuperAdmin()
      );
  }
}

const cases = [
  {
    name: "Teacher updates their own comment, keeping student and teacher same",
    actorRole: "teacher",
    actorId: "teacher1",
    oldData: { studentId: "student1", teacherId: "teacher1", comment: "Old" },
    newData: { studentId: "student1", teacherId: "teacher1", comment: "New" },
    expected: true
  },
  {
    name: "Teacher changes studentId to another student (VULNERABILITY)",
    actorRole: "teacher",
    actorId: "teacher1",
    oldData: { studentId: "student1", teacherId: "teacher1", comment: "Old" },
    newData: { studentId: "student2", teacherId: "teacher1", comment: "Old" },
    expected: false
  },
  {
    name: "Teacher changes teacherId to another teacher (VULNERABILITY)",
    actorRole: "teacher",
    actorId: "teacher1",
    oldData: { studentId: "student1", teacherId: "teacher1", comment: "Old" },
    newData: { studentId: "student1", teacherId: "teacher2", comment: "Old" },
    expected: false
  }
];

cases.forEach(c => {
  const vulnResult = checkCommentUpdate(c, false);
  const fixedResult = checkCommentUpdate(c, true);
  console.log(`${c.name}`);
  console.log(`  Vuln allowed: ${vulnResult}`);
  console.log(`  Fixed allowed: ${fixedResult}`);
});