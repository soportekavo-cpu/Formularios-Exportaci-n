
import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DocumentAttachment } from '../types';

const USE_FIREBASE_STORAGE = false; // Toggle this when ready for production

export const uploadFile = async (file: File, path?: string): Promise<DocumentAttachment> => {
    if (USE_FIREBASE_STORAGE && storage) {
        // Production: Upload to Firebase Storage
        const storagePath = path || `uploads/${new Date().getTime()}-${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        return {
            id: storagePath,
            name: file.name,
            type: file.type,
            url: url // Store URL, no data payload
        };
    } else {
        // Development: Store as Base64 (Legacy method)
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve({
                id: new Date().toISOString() + file.name,
                name: file.name,
                type: file.type,
                data: (reader.result as string).split(',')[1] // Strip base64 prefix
            });
            reader.onerror = error => reject(error);
        });
    }
};
