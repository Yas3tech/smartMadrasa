import { useUsers as useUserContext } from '../context';
import type { User } from '../types';

export interface UseUsersReturn {
  users: User[];
  students: User[];
  addUser: any; // Using any for simplicity since the context types are complex
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

export function useUsers(): UseUsersReturn {
  const { users, students, addUser, updateUser, deleteUser } = useUserContext();

  return {
    users,
    students,
    addUser,
    updateUser,
    deleteUser,
  };
}
