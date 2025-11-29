
import { storage } from './firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { DocumentAttachment } from '../types';

export const uploadFileWithProgress = (
    file: File,
    path: string,
    onProgress: (progress: number) => void
): Promise<DocumentAttachment> => {
    return new Promise((resolve, reject) => {
        if (!storage) {
            console.error("Firebase Storage is not initialized.");
            alert("Error crítico: El servicio de almacenamiento no está disponible.");
            return reject(new Error("Storage not initialized"));
        }

        console.log("Iniciando subida REAL a Firebase Storage...", path);
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error("ERROR DE SUBIDA A STORAGE:", error);
                
                // Detailed error messaging for the user
                let msg = "Error al subir el archivo.";
                if (error.code === 'storage/unauthorized') {
                    msg = "Permiso denegado. Verifica que has iniciado sesión y tienes permisos.";
                } else if (error.code === 'storage/canceled') {
                    msg = "Subida cancelada.";
                } else if (error.code === 'storage/unknown') {
                    msg = "Error desconocido de almacenamiento. Revisa la consola.";
                }
                
                alert(`FALLO LA SUBIDA: ${msg} (Código: ${error.code})`);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log("Subida exitosa. URL:", downloadURL);
                    resolve({
                        id: path,
                        name: file.name,
                        type: file.type,
                        url: downloadURL
                    });
                } catch (urlError) {
                    console.error("Error obteniendo URL de descarga:", urlError);
                    alert("El archivo se subió, pero no se pudo obtener el enlace.");
                    reject(urlError);
                }
            }
        );
    });
};
