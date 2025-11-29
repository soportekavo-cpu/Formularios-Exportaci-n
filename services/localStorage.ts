
import { IDataService, notifyDataChange } from './dataService';

export class LocalStorageService<T extends { id: string }> implements IDataService<T> {
    
    private getCollection(collection: string): T[] {
        try {
            const item = window.localStorage.getItem(collection);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error(`Error reading ${collection} from localStorage`, error);
            return [];
        }
    }

    private saveCollection(collection: string, data: T[]): void {
        try {
            window.localStorage.setItem(collection, JSON.stringify(data));
        } catch (error) {
            console.error(`Error writing ${collection} to localStorage`, error);
        }
    }

    async getAll(collection: string, limit?: number): Promise<T[]> {
        const items = this.getCollection(collection);
        if (limit && limit > 0) {
            return items.slice(0, limit);
        }
        return items;
    }

    async getById(collection: string, id: string): Promise<T | null> {
        const items = this.getCollection(collection);
        return items.find(item => item.id === id) || null;
    }

    async create(collection: string, data: T): Promise<T> {
        const items = this.getCollection(collection);
        // Ensure ID exists
        if (!data.id) {
            data.id = new Date().toISOString();
        }
        items.unshift(data); // Add to beginning
        this.saveCollection(collection, items);
        notifyDataChange({ collection, action: 'create', id: data.id });
        return data;
    }

    async update(collection: string, id: string, data: Partial<T>): Promise<T> {
        const items = this.getCollection(collection);
        const index = items.findIndex(item => item.id === id);
        
        if (index === -1) throw new Error(`Item with id ${id} not found in ${collection}`);
        
        items[index] = { ...items[index], ...data };
        this.saveCollection(collection, items);
        notifyDataChange({ collection, action: 'update', id });
        return items[index];
    }

    async delete(collection: string, id: string): Promise<void> {
        let items = this.getCollection(collection);
        items = items.filter(item => item.id !== id);
        this.saveCollection(collection, items);
        notifyDataChange({ collection, action: 'delete', id });
    }
}
