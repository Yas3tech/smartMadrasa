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
import type { User, Student, Teacher } from '../../types';
import { isFirebaseConfigured } from '../../config/firebase';
import {
  subscribeToUsers,
  createUser as fbCreateUser,
  updateUser as fbUpdateUser,
  deleteUserWithAllData,
  getUserById,
} from '../../services/users';

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
    if (useFirebase) {
      let unsubUsers = () => {};

      if (user?.role === 'student') {
        const student = user as Student;
        unsubUsers = subscribeToUsers(setUsers, [
          ...(student.classId ? [{ classId: student.classId }] : []),
          { role: ['teacher', 'director', 'superadmin'] },
        ]);
      } else if (user?.role === 'teacher') {
        const teacher = user as Teacher;
        const classIds = teacher.classIds || [];

        unsubUsers = subscribeToUsers(setUsers, [
          ...(classIds.length > 0 ? [{ classId: classIds }] : []),
          ...(classIds.length > 0 ? [{ role: 'parent', relatedClassIds: classIds }] : []),
          { role: ['teacher', 'director', 'superadmin'] },
        ]);
      } else {
        unsubUsers = subscribeToUsers(setUsers);
      }

      setIsLoading(false);

      return () => {
        unsubUsers();
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
