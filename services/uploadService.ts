
import { storage } from './firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { DocumentAttachment } from '../types';

export const uploadFileWithProgress = (
    file: File,
    path: string,
    onProgress: (progress: number) => void
): Promise<DocumentAttachment> => {
    return new Promise((resolve, reject) => {
        // Lógica de Producción (Firebase Storage REAL)
        // Intentamos subir siempre a Storage primero.
        if (storage) {
            try {
                console.log("Iniciando subida a Firebase Storage...", path);
                const storageRef = ref(storage, path);
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        onProgress(progress);
                    },
                    (error) => {
                        console.warn("Fallo subida a Storage (CORS o Permisos), intentando modo local (Base64)...", error);
                        // IMPORTANTE: Si falla la subida real, hacemos fallback a local silenciosamente
                        // para que el usuario pueda seguir trabajando.
                        uploadFileLocalFallback(file, onProgress).then(resolve).catch(reject);
                    },
                    async () => {
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            console.log("Subida exitosa:", downloadURL);
                            resolve({
                                id: path,
                                name: file.name,
                                type: file.type,
                                url: downloadURL // Guardamos la URL pública
                            });
                        } catch (urlError) {
                            console.warn("Error obteniendo URL, fallback a local...", urlError);
                            uploadFileLocalFallback(file, onProgress).then(resolve).catch(reject);
                        }
                    }
                );
                return; // Salimos de la función, el listener maneja el flujo
            } catch (e) {
                console.warn("Error inicializando subida, fallback a local...", e);
                // Si falla la inicialización, pasamos al fallback
            }
        }

        // Si no hay storage o falló el bloque anterior inmediatamente, usamos el fallback
        uploadFileLocalFallback(file, onProgress).then(resolve).catch(reject);
    });
};

// Helper para conversión local (Base64) - Respaldo de emergencia
const uploadFileLocalFallback = (file: File, onProgress: (p: number) => void): Promise<DocumentAttachment> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        // Simulamos progreso visualmente
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            onProgress(progress);
            if (progress >= 100) clearInterval(interval);
        }, 100);

        reader.onload = () => {
            setTimeout(() => {
                resolve({
                    id: new Date().toISOString() + file.name,
                    name: file.name,
                    type: file.type,
                    data: (reader.result as string).split(',')[1] // Legacy base64 string
                });
            }, 600);
        };
        reader.onerror = error => reject(error);
    });
};
