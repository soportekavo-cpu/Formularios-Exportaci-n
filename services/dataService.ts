
export interface IDataService<T extends { id: string }> {
    getAll(collection: string, limit?: number): Promise<T[]>;
    getById(collection: string, id: string): Promise<T | null>;
    create(collection: string, data: T): Promise<T>;
    update(collection: string, id: string, data: Partial<T>): Promise<T>;
    delete(collection: string, id: string): Promise<void>;
}

// --- Event Bus for Reactivity ---
export type DataChangeEvent = {
    collection: string;
    action: 'create' | 'update' | 'delete';
    id?: string;
};

type DataChangeListener = (event: DataChangeEvent) => void;
const listeners: DataChangeListener[] = [];

export const subscribeToDataChanges = (listener: DataChangeListener) => {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
    };
};

export const notifyDataChange = (event: DataChangeEvent) => {
    console.log("Data Changed:", event);
    listeners.forEach(listener => listener(event));
};
