import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
import { updateCounters, showToast } from "./ui.js";

let webllmEngine = null;

export async function generateWithWebGPU(systemPrompt, userPrompt, dynamicTemp, progressText, target, signal, onComplete, maxTokens = 500) {
    if (!webllmEngine) {
        progressText.innerText = "Завантаження моделі Llama 3.2 (1GB) в пам'ять браузера...";
        webllmEngine = await CreateMLCEngine("Llama-3.2-1B-Instruct-q4f16_1-MLC", {
            initProgressCallback: (report) => {
                progressText.innerText = report.text;
            }
        });
    }
    
    progressText.innerHTML = "Мислю... <span style='display:inline-block; animation: pulse 1s infinite;'>🧠</span>";
    
    const stream = await webllmEngine.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt }
        ],
        temperature: dynamicTemp,
        max_tokens: maxTokens,
        repetition_penalty: 1.15,
        stream: true
    });
    
    let text = "";
    for await (const chunk of stream) {
        if (signal.aborted) {
            text += " [Зупинено]";
            break;
        }
        const chunkText = chunk.choices[0]?.delta?.content || "";
        text += chunkText;
        
        target.innerHTML = DOMPurify.sanitize(marked.parse(text));
        updateCounters(text);
        
        const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50;
        if (isAtBottom) document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    if (onComplete) onComplete(text);
}

export async function generateWithOllama(url, model, systemPrompt, userPrompt, dynamicTemp, progressText, target, signal, onComplete) {
    progressText.innerHTML = "Мислю... <span style='display:inline-block; animation: pulse 1s infinite;'>🧠</span>";
    
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: signal,
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user",   content: userPrompt }
            ],
            stream: true,
            options: {
                temperature: dynamicTemp,
                repetition_penalty: 1.1
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama повернув помилку (${response.status}). Перевір чи запущений Ollama.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let text = "";
    
    while (true) {
        if (signal.aborted) {
            text += " [Зупинено]";
            break;
        }
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkString = decoder.decode(value, { stream: true });
        const lines = chunkString.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                if (data.message && data.message.content) {
                    text += data.message.content;
                    target.innerHTML = DOMPurify.sanitize(marked.parse(text));
                    updateCounters(text);
                }
            } catch (e) {
                console.warn("Parse error on stream line", e);
            }
        }
        const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50;
        if (isAtBottom) document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    if (onComplete) onComplete(text);
}

export function unloadWebLLM() {
    if (webllmEngine) {
        try {
            webllmEngine.unload();
            console.log("WebLLM engine unloaded from memory.");
        } catch (e) {
            console.error("Error unloading WebLLM engine:", e);
        }
    }
}
