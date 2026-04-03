function checkEventUpdate(testCase, useFix = false) {
  const { actorRole, actorId, teacherClassIds, oldData, newData } = testCase;

  const request = {
    auth: { uid: actorId },
    resource: { data: newData }
  };
  const resource = { data: oldData };

  const isDirector = () => actorRole === 'director';
  const isSuperAdmin = () => actorRole === 'superadmin';
  const isTeacher = () => actorRole === 'teacher';
  const isTeacherForClass = (classId) => isTeacher() && teacherClassIds.includes(classId);

  if (!useFix) {
    return isDirector() || isSuperAdmin() || (
      isTeacher() && isTeacherForClass(resource.data.classId) && resource.data.teacherId == request.auth.uid
    );
  } else {
    return isDirector() || isSuperAdmin() || (
      isTeacher() && isTeacherForClass(resource.data.classId) && resource.data.teacherId == request.auth.uid &&
      request.resource.data.classId == resource.data.classId &&
      request.resource.data.teacherId == resource.data.teacherId
    );
  }
}

const cases = [
  {
    name: "Teacher updates their own event, keeping class and teacher same",
    actorRole: "teacher",
    actorId: "teacher1",
    teacherClassIds: ["classA"],
    oldData: { classId: "classA", teacherId: "teacher1", title: "Old Title" },
    newData: { classId: "classA", teacherId: "teacher1", title: "New Title" },
    expected: true
  },
  {
    name: "Teacher changes classId to another class (VULNERABILITY)",
    actorRole: "teacher",
    actorId: "teacher1",
    teacherClassIds: ["classA"],
    oldData: { classId: "classA", teacherId: "teacher1", title: "Old Title" },
    newData: { classId: "classB", teacherId: "teacher1", title: "Old Title" },
    expected: false
  },
  {
    name: "Teacher changes teacherId to another teacher (VULNERABILITY)",
    actorRole: "teacher",
    actorId: "teacher1",
    teacherClassIds: ["classA"],
    oldData: { classId: "classA", teacherId: "teacher1", title: "Old Title" },
    newData: { classId: "classA", teacherId: "director", title: "Old Title" },
    expected: false
  }
];

cases.forEach(c => {
  const vulnResult = checkEventUpdate(c, false);
  const fixedResult = checkEventUpdate(c, true);
  console.log(`${c.name}`);
  console.log(`  Vuln allowed: ${vulnResult}`);
  console.log(`  Fixed allowed: ${fixedResult}`);
});