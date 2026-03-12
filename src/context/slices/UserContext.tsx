import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '../AuthContext';
import type { User, Student } from '../../types';
import { isFirebaseConfigured } from '../../config/firebase';
import {
  subscribeToUsers,
  createUser as fbCreateUser,
  updateUser as fbUpdateUser,
  deleteUserWithAllData,
  getUserById,
} from '../../services/users';
import type { UserQueryFilters } from '../../services/users';
import { subscribeToClassesByTeacherId } from '../../services/classes';

export interface UserContextType {
  users: User[];
  students: Student[];
  isLoading: boolean;
  addUser: (
    user: User
  ) => Promise<{ uid: string; password?: string; emailSent: boolean } | string | void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const useFirebase = isFirebaseConfigured;
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let unsubUsers = () => { };

    if (useFirebase && user) {
      // SECURITY: Each role only subscribes to the users it needs.
      // Do NOT replace these scoped queries with a generic fetch-all.
      // Teachers must NOT see all student PII — only students in their classes.
      if (user?.role === 'student') {
        const student = user as Student;
        unsubUsers = subscribeToUsers(setUsers, [
          ...(student.classId ? [{ classId: student.classId }] : []),
          { role: ['teacher', 'director', 'superadmin'] },
        ]);
      } else if (user?.role === 'parent') {
        // Parent: See their own children + staff
        const parent = user as any; // Using any to avoid type cast issues with childrenIds vs children
        const studentIds = parent.childrenIds || [];
        const queries: UserQueryFilters[] = [
          { role: ['teacher', 'director', 'superadmin'] },
        ];
        if (studentIds.length > 0) {
          queries.push({ id: studentIds });
        }
        unsubUsers = subscribeToUsers(setUsers, queries);
      } else if (user?.role === 'teacher') {
        // SECURITY: Teacher only sees staff + students in classes they teach.
        let innerUnsubUsers = () => { };
        const unsubTeacherClasses = subscribeToClassesByTeacherId(user.id, (teacherClasses) => {
          innerUnsubUsers();
          const classIds = teacherClasses.map((c) => c.id);
          const queries: UserQueryFilters[] = [
            { role: ['teacher', 'director', 'superadmin'] },
          ];
          if (classIds.length > 0) {
            queries.push({ role: 'student', classId: classIds });
            queries.push({ relatedClassIds: classIds });
          }
          innerUnsubUsers = subscribeToUsers(setUsers, queries);
        });
        unsubUsers = () => {
          unsubTeacherClasses();
          innerUnsubUsers();
        };
      } else if (user && ['director', 'superadmin'].includes(user.role)) {
        // Admin roles: full access to all users
        unsubUsers = subscribeToUsers(setUsers);
      }

      setIsLoading(false);

      const handleWipe = () => {
        if (unsubUsers) unsubUsers();
      };
      window.addEventListener('app:wipeData', handleWipe);

      return () => {
        if (unsubUsers) unsubUsers();
        window.removeEventListener('app:wipeData', handleWipe);
      };
    } else {
      setIsLoading(false);
    }
  }, [useFirebase, user]);

  const students = useMemo(() => users.filter((u): u is Student => u.role === 'student'), [users]);

  const addUser = useCallback(
    async (user: User) => {
      if (useFirebase) {
        return await fbCreateUser(user);
      }
    },
    [useFirebase]
  );

  const updateUser = useCallback(
    async (id: string, updates: Partial<User>) => {
      if (useFirebase) {
        await fbUpdateUser(id, updates);
      }
    },
    [useFirebase]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      if (useFirebase) {
        const userToDelete = users.find((u) => u.id === id);
        if (userToDelete) {
          await deleteUserWithAllData(id, userToDelete.role);
        } else {
          const fetchedUser = await getUserById(id);
          if (fetchedUser) {
            await deleteUserWithAllData(id, fetchedUser.role);
          }
        }
      }
    },
    [useFirebase, users]
  );

  const value = useMemo(
    () => ({
      users,
      students,
      isLoading,
      addUser,
      updateUser,
      deleteUser,
    }),
    [users, students, isLoading, addUser, updateUser, deleteUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within UserProvider');
  }
  return context;
};
