// API base URL - will be empty string in production (same origin)
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

/**
 * Fetches the raw HTML source of a Grokipedia page via our backend.
 * @param term The search term (e.g., "Donald Trump")
 * @returns A promise that resolves to the HTML source code as a string.
 */
export const fetchGrokipediaSource = async (term: string): Promise<string> => {
    const formattedTerm = encodeURIComponent(term.trim()).replace(/%20/g, '_');
    const response = await fetch(`${API_BASE_URL}/api/grokipedia/${formattedTerm}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch from Grokipedia (Status: ${response.status})`);
    }

    const data = await response.json();
    return data.html;
};

/**
 * Uses the browser's DOMParser to extract and clean the main article from raw HTML.
 * @param htmlContent The raw HTML source code.
 * @returns The cleaned inner HTML of the main content area as a string.
 */
export const parseAndCleanHtml = (htmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // The main content of a Grokipedia page is semantically contained within the <article> tag.
    // This is a much more robust selector than relying on specific div structures.
    const contentNode = doc.querySelector('article');

    if (!contentNode) {
        throw new Error("Could not find the main <article> element in the Grokipedia source. The page structure may have changed.");
    }

    // Rewrite relative URLs to be absolute so links and images work correctly.
    const links = contentNode.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/')) {
            link.setAttribute('href', `https://grokipedia.com${href}`);
        }
    });

    const images = contentNode.querySelectorAll('img');
    images.forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('/')) {
            img.setAttribute('src', `https://grokipedia.com${src}`);
        }
    });

    return contentNode.innerHTML;
};


/**
 * Fetches the plain text extract for a given term from Wikipedia via our backend.
 * @param term The search term (e.g., "Albert Einstein")
 * @returns A promise that resolves to the plain text extract.
 */
export const fetchWikipediaExtract = async (term: string): Promise<string> => {
    const formattedTerm = encodeURIComponent(term.trim()).replace(/%20/g, '_');
    const response = await fetch(`${API_BASE_URL}/api/wikipedia/${formattedTerm}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch from Wikipedia (Status: ${response.status})`);
    }

    const data = await response.json();
    return data.extract;
};

/**
 * Sends content from two sources to the Gemini API for a comparison via our backend.
 * @param systemPrompt The system instruction for the AI.
 * @param userPrompt The user's specific request.
 * @param grokipediaText The text content from Grokipedia.
 * @param wikipediaText The text content from Wikipedia.
 * @returns A promise that resolves to the Markdown comparison from the AI.
 */
export const compareContentWithGemini = async (
    systemPrompt: string,
    userPrompt: string,
    grokipediaText: string,
    wikipediaText: string
): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/compare`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            systemPrompt,
            userPrompt,
            grokipediaText,
            wikipediaText,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Gemini API request failed (Status: ${response.status})`);
    }

    const data = await response.json();
    return data.comparison;
};
