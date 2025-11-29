
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";

export function useFirestore<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Monitor auth state to enable/disable listeners
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsAuthenticated(!!user);
        if (!user) {
            setData([]); // Clear data on logout
            setLoading(false);
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) {
        console.error("Firestore not initialized");
        setLoading(false);
        return;
    }

    // Stop if not authenticated to avoid "Insufficient Permissions" errors
    if (!isAuthenticated) {
        return;
    }

    setLoading(true);

    // Default query without ordering to prevent index requirements errors initially
    const q = query(collection(db, collectionName));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, isAuthenticated]);

  const add = async (item: any) => {
      try {
        const { id, ...rest } = item;
        if (id) {
            await setDoc(doc(db, collectionName, id), rest);
        } else {
            await addDoc(collection(db, collectionName), rest);
        }
      } catch (e) {
          console.error(`Error adding to ${collectionName}:`, e);
          throw e;
      }
  };

  const update = async (id: string, item: any) => {
      try {
        const docRef = doc(db, collectionName, id);
        const { id: _, ...dataToUpdate } = item;
        await updateDoc(docRef, dataToUpdate);
      } catch (e) {
          console.error(`Error updating in ${collectionName}:`, e);
          throw e;
      }
  };

  const remove = async (id: string) => {
      try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
      } catch (e) {
          console.error(`Error deleting from ${collectionName}:`, e);
          throw e;
      }
  };

  return { data, loading, add, update, remove };
}
