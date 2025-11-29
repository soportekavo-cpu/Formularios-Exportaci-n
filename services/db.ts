
import { IDataService } from './dataService';
import { LocalStorageService } from './localStorage';
import { FirestoreService } from './firestore';

// Detectar entorno de producción de forma segura
// @ts-ignore
const USE_FIRESTORE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) || (typeof process !== 'undefined' && process.env.NODE_ENV === 'production');

class DatabaseFactory {
    static getService<T extends { id: string }>(): IDataService<T> {
        if (USE_FIRESTORE) {
            return new FirestoreService<T>();
        }
        return new LocalStorageService<T>();
    }
}

export const dbService = DatabaseFactory;
