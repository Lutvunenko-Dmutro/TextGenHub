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

export async function checkServerStatus(statusDiv, statusText, generateButton) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

        const res = await fetch("http://localhost:11434/", { 
            method: "GET",
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            statusDiv.className = "server-status online";
            statusText.textContent = "Ollama Online";
            generateButton.disabled = false;
            return true;
        } else {
            throw new Error("Server not OK");
        }
    } catch (e) {
        statusDiv.className = "server-status offline";
        statusText.innerHTML = "Ollama Offline <span style='font-size:0.8em;opacity:0.8;'>(Потрібен запуск)</span>";
        return false;
    }
}
