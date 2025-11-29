
import { IDataService } from './dataService';
import { LocalStorageService } from './localStorage';
import { FirestoreService } from './firestore';

// Forzar el uso de Firestore para que el Seeder funcione con la base de datos real
const USE_FIRESTORE = true; 

class DatabaseFactory {
    static getService<T extends { id: string }>(): IDataService<T> {
        if (USE_FIRESTORE) {
            return new FirestoreService<T>();
        }
        return new LocalStorageService<T>();
    }
}

export const dbService = DatabaseFactory;
