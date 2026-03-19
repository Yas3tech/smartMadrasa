import re

with open('src/pages/director/Classes.tsx', 'r') as f:
    content = f.read()

# Add useMemo import if missing
if "import { useState" in content and "useMemo" not in content:
    content = content.replace("import { useState }", "import { useState, useMemo }")

# Add the pre-computed maps before the classes.map
# Find the line "const getClassTeacher =" and replace it
replacement = """
  // ⚡ Bolt: Pre-compute maps to optimize O(N^2) render bottleneck
  // Replacing O(N) array lookups (users.find and students.filter) inside classes.map()
  // with O(1) Map lookups. Reduces render complexity to O(N).
  const teacherMap = useMemo(() => {
    const map = new Map();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  const classStudentsMap = useMemo(() => {
    const map = new Map();
    students.forEach(s => {
      const student = s as Student;
      if (student.classId) {
        if (!map.has(student.classId)) map.set(student.classId, []);
        map.get(student.classId).push(student);
      }
    });
    return map;
  }, [students]);

  const getClassTeacher = (id: string) => teacherMap.get(id);
  const getClassStudents = (classId: string) => classStudentsMap.get(classId) || [];
"""

content = re.sub(
    r"  const getClassTeacher = \(id: string\) => users\.find\(\(entry\) => entry\.id === id\);\n  const getClassStudents = \(classId: string\) =>\n    students\.filter\(\(student\) => \(student as Student\)\.classId === classId\);",
    replacement.strip('\n'),
    content
)

with open('src/pages/director/Classes.tsx', 'w') as f:
    f.write(content)

print("Done")
