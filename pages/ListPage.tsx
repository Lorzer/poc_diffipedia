import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { getAllComparisons, ComparisonRecord } from '../services/databaseService';
import { DatabaseListView } from '../components/DatabaseListView';
import { ComparisonModal } from '../components/ComparisonModal';

export const ListPage: React.FC = () => {
    const [comparisons, setComparisons] = useState<ComparisonRecord[]>([]);
    const [selectedComparison, setSelectedComparison] = useState<ComparisonRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadComparisons = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllComparisons();
            setComparisons(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load comparison history.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadComparisons();
    }, [loadComparisons]);

    const handleSelectComparison = (record: ComparisonRecord) => {
        setSelectedComparison(record);
    };

    const handleCloseModal = () => {
        setSelectedComparison(null);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    Comparison History
                </h1>
                <p className="mt-4 text-xl text-gray-400">
                    Review your past comparisons.
                </p>
            </header>

            <div className="max-w-4xl mx-auto">
                {isLoading && (
                    <div className="text-center text-gray-400 py-16">
                         <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>Loading history...</p>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {!isLoading && !error && (
                    <DatabaseListView 
                        comparisons={comparisons} 
                        onSelect={handleSelectComparison} 
                    />
                )}
            </div>

            <ComparisonModal
                isOpen={!!selectedComparison}
                onClose={handleCloseModal}
                content={selectedComparison?.geminiComparison || null}
                error={null} // Not showing errors in this context
            />
        </div>
    );
};
