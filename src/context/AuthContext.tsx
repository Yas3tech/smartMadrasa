import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
        if (!auth || !db) {
            console.error('Firebase auth or db not initialized');
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Set loading to true while we fetch the user profile
                setLoading(true);
                try {
                    // Fetch user details from Firestore
                    const userDoc = await getDoc(doc(db!, 'users', firebaseUser.uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({
                            id: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            name: userData.name || 'Utilisateur',
                            role: userData.role as Role,
                            avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                            // Include role-specific fields (classId for students, childrenIds for parents, etc.)
                            ...userData
                        });
                    } else {
                        // Fallback if user document doesn't exist (shouldn't happen with seeded data)
                        console.warn('User document not found in Firestore');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
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
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {!loading && children}
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
