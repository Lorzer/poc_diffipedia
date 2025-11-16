import React, { useState } from 'react';

interface HtmlDisplayProps {
    htmlContent: string;
    sourceUrl: string;
    textToCopy: string;
}

export const HtmlDisplay: React.FC<HtmlDisplayProps> = ({ htmlContent, sourceUrl, textToCopy }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy text.');
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1.5 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    Source Link
                </a>
                <div className="w-px h-4 bg-gray-600"></div>
                <button 
                    onClick={handleCopy} 
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    disabled={isCopied}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    {isCopied ? 'Copied!' : 'Copy Text'}
                </button>
            </div>
            <div
                className="prose prose-invert prose-lg max-w-none w-full text-gray-300 prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-gray-100 prose-img:rounded-lg overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
};