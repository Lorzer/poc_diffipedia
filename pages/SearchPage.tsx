import React, { useState, useCallback } from 'react';
import { SearchBar } from '../components/SearchBar';
import { HtmlDisplay } from '../components/HtmlDisplay';
import { WikipediaDisplay } from '../components/WikipediaDisplay';
import { ConfigModal } from '../components/ConfigModal';
import { ComparisonModal } from '../components/ComparisonModal';
import { 
    fetchGrokipediaSource, 
    parseAndCleanHtml, 
    fetchWikipediaExtract,
    compareContentWithGemini 
} from '../services/apiService';
import { saveComparison } from '../services/databaseService';

type Stage = 'idle' | 'fetching' | 'comparing' | 'error' | 'success';

export const SearchPage: React.FC = () => {
    // State for data
    const [searchTerm, setSearchTerm] = useState('');
    const [grokipediaHtml, setGrokipediaHtml] = useState<string | null>(null);
    const [wikipediaText, setWikipediaText] = useState<string | null>(null);
    const [comparisonResult, setComparisonResult] = useState<string | null>(null);

    // State for UI
    const [stage, setStage] = useState<Stage>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isConfigModalOpen, setConfigModalOpen] = useState(false);
    const [isComparisonModalOpen, setComparisonModalOpen] = useState(false);
    
    // State for Prompts
    const [systemPrompt, setSystemPrompt] = useState(
        "You are an expert analyst. Your task is to meticulously compare two documents about the same topic from different sources: Grokipedia and Wikipedia. Identify key differences in tone, perspective, factual claims, and omissions. Provide a balanced, neutral, and insightful summary of your findings in well-structured Markdown format."
    );
    const [userPrompt, setUserPrompt] = useState(
        "Please analyze the following texts from Grokipedia and Wikipedia. Based on the content provided, generate a comparative analysis. Focus on:\n1.  **Tone and Bias:** Compare the writing style and any potential bias or point of view presented in each source.\n2.  **Factual Discrepancies:** Highlight any significant differences in facts, figures, or timelines.\n3.  **Content Omissions:** Note if one source includes important information that the other omits.\n4.  **Overall Perspective:** Summarize the main angle or narrative each source seems to promote.\n\nPresent your analysis in clear, well-organized Markdown."
    );

    const handleSearch = useCallback(async (query: string) => {
        setStage('fetching');
        setError(null);
        setSearchTerm(query);
        setGrokipediaHtml(null);
        setWikipediaText(null);
        setComparisonResult(null);

        try {
            // Fetch in parallel
            const [grokHtmlRaw, wikiText] = await Promise.all([
                fetchGrokipediaSource(query),
                fetchWikipediaExtract(query)
            ]);

            const grokHtmlClean = parseAndCleanHtml(grokHtmlRaw);
            
            setGrokipediaHtml(grokHtmlClean);
            setWikipediaText(wikiText);
            setStage('success');
        } catch (err: any) {
            console.error("Search failed:", err);
            setError(err.message || 'An unknown error occurred during the search.');
            setStage('error');
        }
    }, []);

    const handleCompare = async () => {
        if (!grokipediaHtml || !wikipediaText) return;

        setStage('comparing');
        setError(null);
        setComparisonResult(null);
        setComparisonModalOpen(true);

        try {
            // A simple way to get text from HTML for the AI model
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = grokipediaHtml;
            const grokipediaText = tempDiv.textContent || tempDiv.innerText || '';

            const result = await compareContentWithGemini(
                systemPrompt,
                userPrompt,
                grokipediaText,
                wikipediaText
            );
            setComparisonResult(result);
            setStage('success');

            // Save the successful comparison to the database
            await saveComparison({
                term: searchTerm,
                grokipediaHtml: grokipediaHtml,
                wikipediaText: wikipediaText,
                geminiComparison: result,
            });

        } catch (err: any) {
            console.error("Comparison failed:", err);
            setError(err.message || 'An unknown error occurred during the comparison.');
            setStage('error');
        }
    };
    
    const isSearching = stage === 'fetching' || stage === 'comparing';
    const hasResults = grokipediaHtml !== null && wikipediaText !== null;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    Grokipedia vs. Wikipedia Comparator
                </h1>
                <p className="mt-4 text-xl text-gray-400">
                    Analyze and compare articles from two different encyclopedias with Gemini.
                </p>
            </header>

            <section className="mb-8">
                <SearchBar onSearch={handleSearch} onOpenConfig={() => setConfigModalOpen(true)} isSearching={isSearching} />
            </section>
            
            {stage === 'error' && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center my-8 max-w-4xl mx-auto" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {isSearching && stage !== 'comparing' && (
                 <div className="text-center text-gray-400 py-16">
                    <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg">Fetching articles...</p>
                </div>
            )}
            
            {hasResults && (
                <div className="bg-gray-800/50 p-4 sm:p-6 rounded-2xl border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            Search Results for: <span className="text-blue-400">{searchTerm}</span>
                        </h2>
                        <button 
                            onClick={handleCompare}
                            disabled={isSearching}
                            className="bg-green-600 text-white font-semibold px-5 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             {stage === 'comparing' ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                             ) : 'Compare with Gemini'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{height: '60vh'}}>
                        <div className="bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-700 h-full flex flex-col">
                            <h3 className="text-xl font-bold text-gray-100 mb-4 flex-shrink-0">Grokipedia</h3>
                            {grokipediaHtml && (
                                <HtmlDisplay 
                                    htmlContent={grokipediaHtml} 
                                    sourceUrl={`https://grokipedia.com/page/${encodeURIComponent(searchTerm.trim()).replace(/%20/g, '_')}`}
                                    textToCopy={grokipediaHtml}
                                />
                            )}
                        </div>
                        <div className="bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-700 h-full flex flex-col">
                            <h3 className="text-xl font-bold text-gray-100 mb-4 flex-shrink-0">Wikipedia</h3>
                            {wikipediaText && (
                                <WikipediaDisplay 
                                    textContent={wikipediaText} 
                                    sourceUrl={`https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm.trim()).replace(/%20/g, '_')}`}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfigModal 
                isOpen={isConfigModalOpen} 
                onClose={() => setConfigModalOpen(false)}
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
                userPrompt={userPrompt}
                setUserPrompt={setUserPrompt}
            />

            <ComparisonModal
                isOpen={isComparisonModalOpen}
                onClose={() => setComparisonModalOpen(false)}
                content={comparisonResult}
                error={stage === 'error' ? error : null}
            />

        </div>
    );
};
