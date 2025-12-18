import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  type UploadMetadata,
  type UploadTask,
} from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload a file to Firebase Storage
 * @param file The file to upload
 * @param path The storage path (e.g., 'homework/assignment123/student456.pdf')
 * @param metadata Optional metadata for the file
 * @returns The download URL of the uploaded file
 */
export const uploadFile = async (
  file: File,
  path: string,
  metadata?: UploadMetadata
): Promise<string> => {
  if (!storage) throw new Error('Firebase Storage not configured');

  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, metadata);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

/**
 * Upload a file with progress tracking
 * @param file The file to upload
 * @param path The storage path
 * @param onProgress Callback to track upload progress (0-100)
 * @param metadata Optional metadata
 * @returns The download URL of the uploaded file
 */
export const uploadFileWithProgress = (
  file: File,
  path: string,
  onProgress?: (progress: number) => void,
  metadata?: UploadMetadata
): Promise<string> => {
  if (!storage) throw new Error('Firebase Storage not configured');

  return new Promise((resolve, reject) => {
    const storageRef = ref(storage!, path); // Non-null assertion after check
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

/**
 * Delete a file from Firebase Storage
 * @param path The storage path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  if (!storage) throw new Error('Firebase Storage not configured');

  const storageRef = ref(storage!, path);
  await deleteObject(storageRef);
};

/**
 * Get download URL for a file
 * @param path The storage path
 * @returns The download URL
 */
export const getFileURL = async (path: string): Promise<string> => {
  if (!storage) throw new Error('Firebase Storage not configured');

  const storageRef = ref(storage!, path);
  return await getDownloadURL(storageRef);
};

/**
 * List all files in a directory
 * @param path The storage path (directory)
 * @returns Array of file references
 */
export const listFiles = async (path: string) => {
  if (!storage) throw new Error('Firebase Storage not configured');

  const storageRef = ref(storage!, path);
  const result = await listAll(storageRef);
  return result.items;
};

/**
 * Helper to generate a unique file path for homework submissions
 * @param homeworkId The homework ID
 * @param studentId The student ID
 * @param fileName The original file name
 * @returns A unique storage path
 */
export const generateHomeworkPath = (
  homeworkId: string,
  studentId: string,
  fileName: string
): string => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `homework/${homeworkId}/${studentId}/${timestamp}_${sanitizedFileName}`;
};

/**
 * Helper to generate a unique file path for profile pictures
 * @param userId The user ID
 * @param fileName The original file name
 * @returns A unique storage path
 */
export const generateProfilePicturePath = (userId: string, fileName: string): string => {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `profiles/${userId}/${sanitizedFileName}`;
};

/**
 * Helper to generate a unique file path for message attachments
 * @param senderId The sender's user ID
 * @param fileName The original file name
 * @returns A unique storage path
 */
export const generateMessagePath = (senderId: string, fileName: string): string => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `messages/${senderId}/${timestamp}_${sanitizedFileName}`;
};

/**
 * Helper to generate a unique file path for event attachments
 * @param eventId The event ID (or 'new' for creating events)
 * @param fileName The original file name
 * @returns A unique storage path
 */
export const generateEventPath = (eventId: string, fileName: string): string => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `events/${eventId}/${timestamp}_${sanitizedFileName}`;
};
