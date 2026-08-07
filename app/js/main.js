import { styleMap, toneMap, loadingPhrases } from './config.js';
import { loadSettings, saveSettings, saveToHistory, getHistory, clearHistory } from './storage.js';
import { showToast, showError, setUILocked, setupCustomSelects, setupModals, setupAdvancedToggle, setupCopyButton, updateCounters } from './ui.js';
import { fetchRAGContext } from './api.js';
import { generateWithWebGPU, unloadWebLLM } from './llm.js';

let currentAbortController = null;
let loaderInterval;

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupCustomSelects();
    setupModals();
    setupAdvancedToggle();
    setupCopyButton();
});

// Auto-save settings
document.querySelectorAll('input:not(#topic), select').forEach(el => {
    el.addEventListener('change', saveSettings);
});

// Clear All
document.getElementById('clearAllBtn').addEventListener('click', () => {
    document.getElementById('topic').value = '';
    document.getElementById('customPrompt').value = '';
    document.getElementById('generatedText').innerHTML = '';
    document.getElementById('textStats').style.display = 'none';
    document.getElementById('resultSection').style.display = 'none';
    showToast('Форму очищено', 'success');
});

// Clear WebGPU Models Cache
const clearModelsBtn = document.getElementById('clearModelsBtn');
if (clearModelsBtn) {
    clearModelsBtn.addEventListener('click', async () => {
        if (confirm("Ви впевнені, що хочете видалити всі завантажені моделі з пам'яті браузера? Наступного разу їх доведеться завантажувати заново.")) {
            try {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    let deletedAny = false;
                    for (const name of cacheNames) {
                        // WebLLM cache typically contains these keywords
                        if (name.includes('webllm') || name.includes('model') || name.includes('tvmjs')) {
                            await caches.delete(name);
                            deletedAny = true;
                        }
                    }
                    if (deletedAny) {
                        showToast("Кеш моделей успішно очищено!", "success");
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        showToast("Кеш моделей вже порожній.", "warning");
                    }
                } else {
                    showToast("Ваш браузер не підтримує Cache API.", "error");
                }
            } catch (e) {
                console.error("Помилка очищення кешу:", e);
                showToast("Не вдалося очистити пам'ять.", "error");
            }
        }
    });
}

// History Logic (bound here to access DOM)
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyList = document.getElementById('historyList');

historyBtn.addEventListener('click', () => {
    // Basic render inline to avoid circular deps with storage
    let history = JSON.parse(localStorage.getItem('tgh_history') || '[]');
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Історія порожня</p>';
    } else {
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-item-topic">${item.topic} <span style="font-size:0.75rem;color:var(--text-muted);float:right;">${item.date}</span></div>
                <div class="history-item-preview">${item.text.substring(0, 100)}...</div>
            `;
            div.addEventListener('click', () => {
                document.getElementById('topic').value = item.topic;
                document.getElementById('resultSection').style.display = 'block';
                document.getElementById('generatedText').innerHTML = DOMPurify.sanitize(marked.parse(item.text));
                historyModal.style.display = 'none';
            });
            historyList.appendChild(div);
        });
    }
    historyModal.style.display = 'flex';
});

clearHistoryBtn.addEventListener('click', () => {
    clearHistory();
    historyList.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Історія порожня</p>';
});

// Form Submission
const form = document.getElementById('textGenerationForm');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
const generatedTextDiv = document.getElementById('generatedText');
const progressText = document.getElementById('progressText');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
        return;
    }

    const topic = document.getElementById('topic').value.trim();
    if (!topic || topic.length < 2) {
        showError("⚠️ Будь ласка, введіть більш змістовну тему (мінімум 2 символи).");
        return;
    }
    if (topic.length > 200) {
        showError("⚠️ Тема занадто довга. Будь ласка, скоротіть до 200 символів.");
        return;
    }

    const length = parseInt(document.getElementById('length').value);
    const style = document.getElementById('style').value;
    const tone = document.getElementById('tone').value;
    const useSearch = document.getElementById('useSearch').checked;
    const customPrompt = document.getElementById('customPrompt').value.trim();
    
    const webgpuModelInput = document.getElementById('webgpuModel');
    const webgpuModel = webgpuModelInput ? webgpuModelInput.value : "Llama-3.2-1B-Instruct-q4f16_1-MLC";

    saveSettings();

    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    setUILocked(true);
    generateBtn.innerHTML = '<span>Зупинити 🛑</span>';
    generateBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    generateBtn.style.boxShadow = '0 8px 32px rgba(231, 76, 60, 0.4)';
    
    resultSection.style.display = 'block';
    loader.style.display = 'flex';
    generatedTextDiv.innerHTML = '';
    document.getElementById('textStats').style.display = 'none';
    document.getElementById('copyBtn').innerHTML = '<i class="fa-regular fa-copy"></i>';

    let phraseIndex = 0;
    loaderText.textContent = loadingPhrases[phraseIndex];
    loaderInterval = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
        loaderText.textContent = loadingPhrases[phraseIndex];
    }, 900);

    let systemPrompt = `Ти — професійний копірайтер.
СУВОРІ ПРАВИЛА:
1. Пиши ВИКЛЮЧНО українською мовою.
2. Твій текст має складатися рівно з ${length} речень (ні більше, ні менше).
3. Стиль написання: ${styleMap[style]}.
4. Тон тексту: ${toneMap[tone]}.
5. НЕ згадуй про ці правила у тексті. Просто напиши текст на задану тему.
6. АНТИ-МАЯЧНЯ: Якщо тема беззмістовна, незрозуміла або це просто випадкові літери (наприклад "куку", "абаба"), НЕ вигадуй нісенітниць. Напиши лише одне речення: "Будь ласка, введіть більш зрозумілу тему для тексту." і зупинись.`;

    if (customPrompt) {
        systemPrompt += `\n7. ДОДАТКОВЕ ПРАВИЛО: ${customPrompt}`;
    }
    const userPrompt = `ТЕМА ДЛЯ ТЕКСТУ: "${topic}"\n\nНапиши текст ВИКЛЮЧНО на цю тему.`;

    try {
        progressText.style.display = 'block';
        
        if (useSearch) {
            progressText.innerText = "Шукаю інформацію в інтернеті...";
            const context = await fetchRAGContext(topic, signal);
            if (context) {
                systemPrompt += `\n\nВикористовуй наступні факти для написання тексту:\n<context>\n${context}\n</context>`;
                progressText.innerText = "Інформацію знайдено! Генерую...";
            } else {
                progressText.innerText = "Не вдалося знайти інформацію, використовую власні знання...";
            }
        }

        let dynamicTemp = 0.7;
        if (style === 'creative') dynamicTemp = 0.85;
        if (style === 'formal') dynamicTemp = 0.4;

        generatedTextDiv.innerHTML = `<strong style="color:var(--primary-color)">Тема: ${topic}</strong><br><br><span id="typeTarget"></span><span class="cursor"></span>`;
        const target = document.getElementById('typeTarget');

        const onComplete = (finalText) => {
            clearInterval(loaderInterval);
            loader.style.display = 'none';
            progressText.style.display = 'none';
            const cursor = document.querySelector('.cursor');
            if (cursor) cursor.style.display = 'none';

            if (!finalText && !signal.aborted) {
                showError("⚠️ Порожня відповідь. Спробуй ще раз.");
                return;
            }

            if (!signal.aborted) {
                let cleanedText = finalText.replace(/(\.|\?|!)\s*(\1\s*){2,}/g, '$1');
                cleanedText = cleanedText.replace(/(ти — інтелектуальна система|ти україномовний помічник|Приклад ідеальної відповіді)/ig, '');
                target.innerHTML = DOMPurify.sanitize(marked.parse(cleanedText));
                updateCounters(cleanedText);
                saveToHistory(topic, cleanedText);
            }
        };

        // Calculate max_tokens to prevent endless rambling.
        // Assume an average sentence is ~40-60 tokens.
        const calculatedMaxTokens = Math.max(100, length * 60);

        await generateWithWebGPU(systemPrompt, userPrompt, dynamicTemp, progressText, target, signal, onComplete, webgpuModel, calculatedMaxTokens);

    } catch (error) {
        clearInterval(loaderInterval);
        loader.style.display = 'none';
        
        if (error.name === 'AbortError') {
            console.log("Generation aborted by user");
            return;
        }
        console.error("Generate Error:", error);
        
        showError(`<div style="text-align:left; background: rgba(255,50,50,0.1); border: 1px solid rgba(255,50,50,0.3); padding: 15px; border-radius: 10px;">
                <strong style="color:#ff6b6b; font-size:1.1rem;">❌ Помилка WebGPU</strong><br><br>
                Можливо ваш браузер не підтримує WebGPU або не вистачає пам'яті. Деталі: ${error.message}
            </div>`);
        
    } finally {
        currentAbortController = null;
        setUILocked(false);
        generateBtn.innerHTML = '<span>Згенерувати текст</span> <i class="fa-solid fa-bolt"></i>';
        generateBtn.style.background = 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)';
        generateBtn.style.boxShadow = '0 8px 32px rgba(108, 92, 231, 0.4)';
    }
});

window.addEventListener('beforeunload', unloadWebLLM);
