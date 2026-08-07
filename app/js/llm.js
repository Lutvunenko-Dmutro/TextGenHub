import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
import { updateCounters, showToast } from "./ui.js";

let webllmEngine = null;
let currentWebllmModel = null;

export async function generateWithWebGPU(systemPrompt, userPrompt, dynamicTemp, progressText, target, signal, onComplete, modelId = "Llama-3.2-1B-Instruct-q4f16_1-MLC", maxTokens = 500) {
    if (!webllmEngine || currentWebllmModel !== modelId) {
        if (webllmEngine) {
            try { webllmEngine.unload(); } catch(e) {}
            webllmEngine = null;
        }
        progressText.innerText = `Завантаження моделі ${modelId} в пам'ять браузера...`;
        webllmEngine = await CreateMLCEngine(modelId, {
            initProgressCallback: (report) => {
                progressText.innerText = report.text;
            }
        });
        currentWebllmModel = modelId;
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
