import { isFirebaseConfigured } from '../config/firebase';
import { resetFirebaseData } from './initFirebase';

// Main seeding function
export const seedDatabase = async (): Promise<boolean> => {
    if (!isFirebaseConfigured) {
        console.error('❌ Firebase not configured. Please set up your .env file.');
        console.log('See FIREBASE_SETUP.md for instructions.');
        return false;
    }

    try {
        console.log('🌱 Starting database seeding via initFirebase...');
        await resetFirebaseData();
        return true;
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        return false;
    }
};

// Expose to window for easy console access
if (typeof window !== 'undefined') {
    (window as any).seedDatabase = seedDatabase;
    console.log('💡 Run seedDatabase() in the console to populate Firebase with demo data');
}
