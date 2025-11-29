
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, setDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function useFirestore<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
        console.error("Firestore not initialized");
        setLoading(false);
        return;
    }

    // Intentamos ordenar por 'id' o fecha si es posible, por defecto sin orden para evitar errores de índices
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
  }, [collectionName]);

  const add = async (item: any) => {
      try {
        const { id, ...rest } = item;
        // Si el item ya tiene un ID (ej: generado por frontend con fechas/uuid), usamos setDoc para preservarlo.
        // Si no, usamos addDoc para que Firestore genere uno.
        // En esta app, muchos IDs se generan como ISOStrings, así que preferimos setDoc si existe.
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
        // Eliminamos id del objeto update para evitar redundancia o errores
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
