import React from 'react';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    systemPrompt: string;
    setSystemPrompt: (value: string) => void;
    userPrompt: string;
    setUserPrompt: (value: string) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ 
    isOpen, 
    onClose, 
    systemPrompt, 
    setSystemPrompt, 
    userPrompt, 
    setUserPrompt 
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="config-modal-title"
        >
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 id="config-modal-title" className="text-2xl font-bold text-white">Gemini Configuration</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition"
                        aria-label="Close configuration modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                
                <div className="p-6 space-y-6 overflow-y-auto" style={{maxHeight: '70vh'}}>
                    <div>
                        <label htmlFor="system-prompt" className="block text-sm font-semibold text-gray-300 mb-2">
                            System Prompt
                        </label>
                        <textarea
                            id="system-prompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            rows={5}
                            className="w-full bg-gray-900 text-gray-200 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            placeholder="Enter the system instruction for the AI..."
                        />
                         <p className="text-xs text-gray-500 mt-1">This sets the overall behavior and persona for the AI analyst.</p>
                    </div>
                    <div>
                        <label htmlFor="user-prompt" className="block text-sm font-semibold text-gray-300 mb-2">
                            User Prompt
                        </label>
                        <textarea
                            id="user-prompt"
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            rows={4}
                            className="w-full bg-gray-900 text-gray-200 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            placeholder="Enter the user's specific request..."
                        />
                         <p className="text-xs text-gray-500 mt-1">This is the specific task the AI will perform with the article content.</p>
                    </div>
                </div>

                <footer className="p-6 border-t border-gray-700 flex justify-end">
                     <button
                        onClick={onClose}
                        className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all"
                    >
                        Done
                    </button>
                </footer>
            </div>
        </div>
    );
};
