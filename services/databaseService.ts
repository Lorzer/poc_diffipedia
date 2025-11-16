const DB_NAME = 'GrokComparatorDB';
const DB_VERSION = 1;
const STORE_NAME = 'comparisons';

export interface ComparisonRecord {
    id: number;
    term: string;
    grokipediaHtml: string;
    wikipediaText: string;
    geminiComparison: string;
    timestamp: Date;
}

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Database error:", request.error);
            reject("Error opening database");
        };

        request.onsuccess = (event) => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const tempDb = request.result;
            if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
                tempDb.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

export const saveComparison = async (record: Omit<ComparisonRecord, 'id' | 'timestamp'>): Promise<number> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const recordToSave = {
            ...record,
            timestamp: new Date(),
        };

        const request = store.add(recordToSave);

        request.onsuccess = () => {
            resolve(request.result as number);
        };

        request.onerror = () => {
            console.error("Error saving comparison:", request.error);
            reject("Could not save the comparison to the database.");
        };
    });
};

export const getAllComparisons = async (): Promise<ComparisonRecord[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by most recent first
            const sorted = request.result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            resolve(sorted);
        };

        request.onerror = () => {
            console.error("Error fetching comparisons:", request.error);
            reject("Could not fetch comparisons from the database.");
        };
    });
};

export const getComparisonById = async (id: number): Promise<ComparisonRecord | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error("Error fetching comparison by ID:", request.error);
            reject("Could not fetch the comparison from the database.");
        };
    });
};
