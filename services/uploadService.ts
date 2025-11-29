
import { storage } from './firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { DocumentAttachment } from '../types';

// Detectar si estamos en producción para usar Storage real
// @ts-ignore
const isProduction = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) || (typeof process !== 'undefined' && process.env.NODE_ENV === 'production');

export const uploadFileWithProgress = (
    file: File,
    path: string,
    onProgress: (progress: number) => void
): Promise<DocumentAttachment> => {
    return new Promise((resolve, reject) => {
        // Lógica de Producción (Firebase Storage REAL)
        // Esto soluciona el problema de 1MB porque sube directo al bucket.
        if (isProduction && storage) {
            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress);
                },
                (error) => {
                    console.error("Upload failed:", error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({
                        id: path,
                        name: file.name,
                        type: file.type,
                        url: downloadURL // Guardamos la URL pública
                    });
                }
            );
        } else {
            // MODO DESARROLLO (Local): Simular subida con Base64 (Legacy)
            console.warn("Modo Desarrollo: Simulando subida (Base64 local).");
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += 20;
                onProgress(progress);
                if (progress >= 100) clearInterval(interval);
            }, 200);

            reader.onload = () => {
                setTimeout(() => {
                    resolve({
                        id: new Date().toISOString() + file.name,
                        name: file.name,
                        type: file.type,
                        data: (reader.result as string).split(',')[1] // Legacy base64
                    });
                }, 1200);
            };
            reader.onerror = error => reject(error);
        }
    });
};
