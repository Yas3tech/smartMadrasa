import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { isFirebaseConfigured, app } from './firebase';

let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured && app) {
  try {
    db = getFirestore(app);
    storage = getStorage(app);
  } catch {
    // Silent fail
  }
}

export { db, storage };
