export async function fetchRAGContext(topic, signal) {
    try {
        const searchRes = await fetch(`/api/search?q=${encodeURIComponent(topic)}`, { signal });
        const searchData = await searchRes.json();
        
        if (searchData.success && searchData.results.length > 0) {
            let context = searchData.results.join('\n');
            if (context.length > 1500) context = context.substring(0, 1500) + "...";
            return context;
        }
    } catch (e) {
        console.warn("RAG Search failed", e);
    }
    return null;
}

