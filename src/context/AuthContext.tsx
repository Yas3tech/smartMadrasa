import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/db';
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
          if (db) {
            let userData = null;

            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              userData = userDoc.exists() ? userDoc.data() : null;
            } catch (docError: unknown) {
              console.warn('Initial doc fetch failed (likely mismatched UID permissions):', docError.message);
            }

            // Fallback: If no doc found by UID or permission denied, search by email
            if (!userData && firebaseUser.email) {
              const { getUserByEmail } = await import('../services/users');
              const userByEmail = await getUserByEmail(firebaseUser.email);
              if (userByEmail) {
                userData = userByEmail;
              }
            }

            if (userData) {
              console.log('Firebase user found in Firestore:', userData);
              setUser({
                ...userData,
                id: userData.id || firebaseUser.uid,
                email: firebaseUser.email || '',
                name: userData.name || 'Utilisateur',
                role: userData.role as Role,
              });
            } else {
              console.warn('Firebase user logged in but no Firestore document found for UID or Email:', firebaseUser.uid, firebaseUser.email);
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user document in AuthContext:', error);
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
    } catch {
      // Sign-out errors are non-critical; user intent is clear
    }
  };

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
