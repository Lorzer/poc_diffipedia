// API base URL - will be empty string in production (same origin)
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

export interface ComparisonRecord {
    id: number;
    term: string;
    grokipediaHtml: string;
    wikipediaText: string;
    geminiComparison: string;
    timestamp: Date | string;
}

export const saveComparison = async (record: Omit<ComparisonRecord, 'id' | 'timestamp'>): Promise<number> => {
    const response = await fetch(`${API_BASE_URL}/api/comparisons`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Could not save the comparison to the database.');
    }

    const data = await response.json();
    return data.id;
};

export const getAllComparisons = async (): Promise<ComparisonRecord[]> => {
    const response = await fetch(`${API_BASE_URL}/api/comparisons`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Could not fetch comparisons from the database.');
    }

    const data = await response.json();
    return data;
};

export const getComparisonById = async (id: number): Promise<ComparisonRecord | undefined> => {
    const response = await fetch(`${API_BASE_URL}/api/comparisons/${id}`);

    if (!response.ok) {
        if (response.status === 404) {
            return undefined;
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Could not fetch the comparison from the database.');
    }

    const data = await response.json();
    return data;
};

export const deleteComparison = async (id: number): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/api/comparisons/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        if (response.status === 404) {
            return false;
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Could not delete the comparison from the database.');
    }

    return true;
};
