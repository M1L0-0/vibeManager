import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DishRecord {
    id: string;
    name: string;
    timestamp: number;
    thumbnail: string; // Base64 data URL
    data: string; // JSON string of the grid state
}

interface DishLibraryDB extends DBSchema {
    dishes: {
        key: string;
        value: DishRecord;
        indexes: { 'by-date': number };
    };
}

const DB_NAME = 'vibe-manager-incubator';
const DB_VERSION = 1;

class LibraryDB {
    private dbPromise: Promise<IDBPDatabase<DishLibraryDB>>;

    constructor() {
        if (typeof window === 'undefined') {
            this.dbPromise = new Promise(() => { }); // Server-side dummy
            return;
        }

        this.dbPromise = openDB<DishLibraryDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore('dishes', { keyPath: 'id' });
                store.createIndex('by-date', 'timestamp');
            },
        });
    }

    async saveDish(dish: DishRecord): Promise<void> {
        const db = await this.dbPromise;
        await db.put('dishes', dish);
    }

    async getAllDishes(): Promise<DishRecord[]> {
        const db = await this.dbPromise;
        return db.getAllFromIndex('dishes', 'by-date');
    }

    async getDish(id: string): Promise<DishRecord | undefined> {
        const db = await this.dbPromise;
        return db.get('dishes', id);
    }

    async deleteDish(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('dishes', id);
    }
}

export const libraryDB = new LibraryDB();
export type { DishRecord };
