
import { IDataService, notifyDataChange } from './dataService';
import { db } from './firebaseConfig';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, addDoc, query, limit as limitQuery } from "firebase/firestore";

export class FirestoreService<T extends { id: string }> implements IDataService<T> {
    
    async getAll(collectionName: string, limit?: number): Promise<T[]> {
        if (!db) throw new Error("Firestore not initialized");
        const colRef = collection(db, collectionName);
        
        let q;
        if (limit && limit > 0) {
            q = query(colRef, limitQuery(limit));
        } else {
            q = colRef;
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
    }

    async getById(collectionName: string, id: string): Promise<T | null> {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as T;
        } else {
            return null;
        }
    }

    async create(collectionName: string, data: T): Promise<T> {
        if (!db) throw new Error("Firestore not initialized");
        // If data has an ID, set it explicitly, otherwise addDoc auto-generates
        if (data.id) {
            await setDoc(doc(db, collectionName, data.id), data);
            notifyDataChange({ collection: collectionName, action: 'create', id: data.id });
            return data;
        } else {
            const docRef = await addDoc(collection(db, collectionName), data);
            notifyDataChange({ collection: collectionName, action: 'create', id: docRef.id });
            return { ...data, id: docRef.id };
        }
    }

    async update(collectionName: string, id: string, data: Partial<T>): Promise<T> {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, data as any);
        notifyDataChange({ collection: collectionName, action: 'update', id });
        return { ...data, id } as T; 
    }

    async delete(collectionName: string, id: string): Promise<void> {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, collectionName, id));
        notifyDataChange({ collection: collectionName, action: 'delete', id });
    }
}
