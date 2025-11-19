import { GoogleGenAI } from "@google/genai";

/**
 * Fetches the raw HTML source of a Grokipedia page.
 * @param term The search term (e.g., "Donald Trump")
 * @returns A promise that resolves to the HTML source code as a string.
 */
export const fetchGrokipediaSource = async (term: string): Promise<string> => {
    // Use our Express backend proxy - same origin, no CORS issues!
    const formattedTerm = encodeURIComponent(term.trim());
    const proxyUrl = `/api/proxy/grokipedia?term=${formattedTerm}`;

    const response = await fetch(proxyUrl);

    if (!response.ok) {
        // Try to parse error message from JSON response
        let errorMessage = `Failed to fetch from Grokipedia (Status: ${response.status})`;
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error;
            }
        } catch {
            // If response is not JSON, use default message
        }
        throw new Error(errorMessage);
    }

    const html = await response.text();
    if (!html || html.includes("This page does not exist yet")) {
        throw new Error(`The Grokipedia page for "${term}" does not exist.`);
    }
    return html;
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
 * Fetches the plain text extract for a given term from Wikipedia.
 * @param term The search term (e.g., "Albert Einstein")
 * @returns A promise that resolves to the plain text extract.
 */
export const fetchWikipediaExtract = async (term: string): Promise<string> => {
    const formattedTerm = encodeURIComponent(term.trim());
    // `origin=*` is a required parameter to enable CORS for the Wikipedia API.
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${formattedTerm}&format=json&origin=*`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch from Wikipedia API. (Status: ${response.status})`);
    }

    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0]; // Get the first (and only) page ID

    // -1 indicates a missing page
    if (!pageId || pageId === '-1') {
        throw new Error(`The Wikipedia page for "${term}" does not exist.`);
    }

    const extract = pages[pageId].extract;
    if (!extract) {
         throw new Error(`No summary extract found on Wikipedia for "${term}". It might be a redirect or disambiguation page.`);
    }

    return extract;
};

/**
 * Sends content from two sources to the Gemini API for a comparison.
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
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const fullPrompt = `
        ${userPrompt}

        --- GROKIPEDIA TEXT ---
        ${grokipediaText}

        --- WIKIPEDIA TEXT ---
        ${wikipediaText}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: fullPrompt,
            config: {
                systemInstruction: systemPrompt,
                // Enable thinking for more complex reasoning. 
                // The max budget for 2.5 Pro is 32768.
                thinkingConfig: { thinkingBudget: 32768 } 
            },
        });
        
        return response.text;
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new Error(`Gemini API request failed: ${error.message}`);
    }
};
