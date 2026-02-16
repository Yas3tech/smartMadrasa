import sys

try:
    with open('src/services/classes.ts', 'r') as f:
        content = f.read()

    # Replacement 1: Imports
    search_import = """import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';"""

    replace_import = """import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  documentId,
} from 'firebase/firestore';"""

    if search_import not in content:
        print("Error: Could not find import block")
        sys.exit(1)

    content = content.replace(search_import, replace_import)

    # Replacement 2: Function
    search_func = """export const subscribeToClasses = (callback: (classes: ClassGroup[]) => void) => {
  if (!db) return () => { };
  return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
    const classes = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as ClassGroup);
    callback(classes);
  });
};"""

    replace_func = """export const subscribeToClasses = (
  callback: (classes: ClassGroup[]) => void,
  classIds?: string[]
) => {
  if (!db) return () => { };

  if (classIds) {
    if (classIds.length === 0) {
      callback([]);
      return () => { };
    }

    const q = query(collection(db, COLLECTION_NAME), where(documentId(), 'in', classIds));
    return onSnapshot(q, (snapshot) => {
      const classes = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as ClassGroup);
      callback(classes);
    });
  }

  return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
    const classes = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as ClassGroup);
    callback(classes);
  });
};"""

    if search_func not in content:
        print("Error: Could not find function block")
        # Print content around expected location for debugging
        print("Content sample:")
        print(content[-500:])
        sys.exit(1)

    content = content.replace(search_func, replace_func)

    with open('src/services/classes.ts', 'w') as f:
        f.write(content)
    print("Successfully modified src/services/classes.ts")

except Exception as e:
    print(f"An error occurred: {e}")
    sys.exit(1)
