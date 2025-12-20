import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import type { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          // Dynamic import firestore only when needed
          const { doc, getDoc } = await import('firebase/firestore');
          const { db: firestoreDb } = await import('../config/db');

          if (firestoreDb) {
            let userDoc = await getDoc(doc(firestoreDb, 'users', firebaseUser.uid));
            let userData = userDoc.exists() ? userDoc.data() : null;

            // Fallback: If no doc found by UID, try searching by email
            if (!userData && firebaseUser.email) {
              const { getUserByEmail } = await import('../services/users');
              const userByEmail = await getUserByEmail(firebaseUser.email);
              if (userByEmail) {
                userData = userByEmail;
              }
            }

            if (userData) {
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: userData.name || 'Utilisateur',
                role: userData.role as Role,
                ...userData,
              });
            } else {
              setUser(null);
            }
          }
        } catch (error) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
