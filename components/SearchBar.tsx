import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    onOpenConfig: () => void;
    isSearching: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onOpenConfig, isSearching }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && !isSearching) {
            onSearch(query.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-2xl mx-auto">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a topic to compare (e.g., 'Artificial Intelligence')"
                className="flex-grow bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                disabled={isSearching}
            />
            <button
                type="submit"
                className="bg-blue-600 text-white font-semibold px-5 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSearching || !query.trim()}
            >
                {isSearching ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : 'Search'}
            </button>
            <button
                type="button"
                onClick={onOpenConfig}
                className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Open Gemini configuration"
                disabled={isSearching}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L8 7.45M7 13h6M11.49 16.83c.38 1.56 2.6 1.56 2.98 0L12 12.55M17 10a7 7 0 11-14 0 7 7 0 0114 0z" clipRule="evenodd" />
                </svg>
            </button>
        </form>
    );
};
