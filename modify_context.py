import sys

try:
    with open('src/context/DataContext.tsx', 'r') as f:
        content = f.read()

    # Step 1: Remove the const unsubClasses = ... line
    # And replace it with let unsubClasses = () => {};
    # But wait, unsubClasses is defined alongside unsubUsers.
    # I should find the block of subscriptions.

    search_block = """      // Subscribe to Firebase collections
      const unsubUsers = subscribeToUsers(setUsers);
      const unsubClasses = subscribeToClasses(setClasses);
      const unsubMessages = subscribeToMessages(setMessages);"""

    replace_block = """      // Subscribe to Firebase collections
      const unsubUsers = subscribeToUsers(setUsers);
      const unsubMessages = subscribeToMessages(setMessages);"""

    if search_block not in content:
        print("Error: Could not find subscription block")
        sys.exit(1)

    content = content.replace(search_block, replace_block)

    # Step 2: Initialize let unsubClasses = () => {}; inside role-based section
    search_role_vars = """      // Role-based subscriptions
      let unsubGrades = () => { };"""

    replace_role_vars = """      // Role-based subscriptions
      let unsubClasses = () => { };
      let unsubGrades = () => { };"""

    if search_role_vars not in content:
        print("Error: Could not find role vars block")
        sys.exit(1)

    content = content.replace(search_role_vars, replace_role_vars)

    # Step 3: Add subscription for Parent
    # Look for: const classIds = childrenData.map((c) => c.classId).filter(Boolean);

    search_parent = """        const classIds = childrenData.map((c) => c.classId).filter(Boolean);

        if (childIds.length > 0) {"""

    replace_parent = """        const classIds = childrenData.map((c) => c.classId).filter(Boolean);

        unsubClasses = subscribeToClasses(setClasses, classIds);

        if (childIds.length > 0) {"""

    if search_parent not in content:
        print("Error: Could not find parent block")
        sys.exit(1)

    content = content.replace(search_parent, replace_parent)

    # Step 4: Add subscription for Student
    search_student = """        if (user?.role === 'student') {
          const student = user as Student;
          unsubEvents = student.classId
            ? subscribeToEvents(setEvents, [student.classId])
            : () => { };
          setupDefaultSubs();"""

    replace_student = """        if (user?.role === 'student') {
          const student = user as Student;
          unsubClasses = subscribeToClasses(setClasses, student.classId ? [student.classId] : []);
          unsubEvents = student.classId
            ? subscribeToEvents(setEvents, [student.classId])
            : () => { };
          setupDefaultSubs();"""

    if search_student not in content:
        print("Error: Could not find student block")
        sys.exit(1)

    content = content.replace(search_student, replace_student)

    # Step 5: Add subscription for Teacher
    search_teacher = """        } else if (user?.role === 'teacher') {
          const teacher = user as Teacher;
          unsubEvents =
            teacher.classIds?.length > 0 ? subscribeToEvents(setEvents, teacher.classIds) : () => { };
          setupDefaultSubs();"""

    replace_teacher = """        } else if (user?.role === 'teacher') {
          const teacher = user as Teacher;
          unsubClasses = subscribeToClasses(setClasses, teacher.classIds || []);
          unsubEvents =
            teacher.classIds?.length > 0 ? subscribeToEvents(setEvents, teacher.classIds) : () => { };
          setupDefaultSubs();"""

    if search_teacher not in content:
        print("Error: Could not find teacher block")
        sys.exit(1)

    content = content.replace(search_teacher, replace_teacher)

    # Step 6: Add subscription for Others
    search_others = """        } else {
          // Default / Admin / Director behavior (Fetch All)
          unsubEvents = subscribeToEvents(setEvents);
          setupDefaultSubs();
        }"""

    replace_others = """        } else {
          // Default / Admin / Director behavior (Fetch All)
          unsubClasses = subscribeToClasses(setClasses);
          unsubEvents = subscribeToEvents(setEvents);
          setupDefaultSubs();
        }"""

    if search_others not in content:
        print("Error: Could not find others block")
        sys.exit(1)

    content = content.replace(search_others, replace_others)

    with open('src/context/DataContext.tsx', 'w') as f:
        f.write(content)
    print("Successfully modified src/context/DataContext.tsx")

except Exception as e:
    print(f"An error occurred: {e}")
    sys.exit(1)
