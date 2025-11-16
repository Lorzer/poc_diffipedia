import React from 'react';
import { ComparisonRecord } from '../services/databaseService';

interface DatabaseListViewProps {
    comparisons: ComparisonRecord[];
    onSelect: (record: ComparisonRecord) => void;
}

export const DatabaseListView: React.FC<DatabaseListViewProps> = ({ comparisons, onSelect }) => {
    if (comparisons.length === 0) {
        return (
            <div className="text-center text-gray-400 py-16">
                <p className="text-lg">No comparison history found.</p>
                <p>Perform a search and comparison to see your history here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {comparisons.map((record) => (
                <button
                    key={record.id}
                    onClick={() => onSelect(record)}
                    className="w-full text-left p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700/50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">{record.term}</h3>
                        <p className="text-sm text-gray-400">
                            {new Date(record.timestamp).toLocaleString()}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
};
