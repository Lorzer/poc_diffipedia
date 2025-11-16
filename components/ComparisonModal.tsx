import React, { useMemo } from 'react';

// Make sure marked is available on the window object
declare global {
    interface Window {
        marked: {
            parse(markdown: string): string;
        };
    }
}

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string | null;
    error: string | null;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, content, error }) => {
    if (!isOpen) return null;

    const parsedContent = useMemo(() => {
        if (content && window.marked) {
            // Use marked to convert Markdown to HTML
            return window.marked.parse(content);
        }
        return '';
    }, [content]);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-modal-title"
        >
            <div
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-700 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 id="comparison-modal-title" className="text-2xl font-bold text-white">Gemini Comparison</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                        aria-label="Close comparison modal"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="p-6 sm:p-8 overflow-y-auto" style={{ maxHeight: '75vh' }}>
                    {error && (
                        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">
                            <strong className="font-bold">Analysis Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    {content && (
                        <div
                            className="prose prose-invert prose-lg max-w-none w-full text-gray-300 prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-gray-100 prose-img:rounded-lg"
                            dangerouslySetInnerHTML={{ __html: parsedContent }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
