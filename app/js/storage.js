export function loadSettings() {
    const savedLength = localStorage.getItem('tgh_length');
    const savedStyle = localStorage.getItem('tgh_style');
    const savedTone = localStorage.getItem('tgh_tone');
    const savedProvider = localStorage.getItem('tgh_provider');
    const savedRAG = localStorage.getItem('tgh_rag');
    
    if (savedLength) document.getElementById('length').value = savedLength;
    if (savedStyle) document.getElementById('style').value = savedStyle;
    if (savedTone) document.getElementById('tone').value = savedTone;
    if (savedProvider) document.getElementById('provider').value = savedProvider;
    if (savedRAG !== null) document.getElementById('useSearch').checked = savedRAG === 'true';
}

export function saveSettings() {
    localStorage.setItem('tgh_length', document.getElementById('length').value);
    localStorage.setItem('tgh_style', document.getElementById('style').value);
    localStorage.setItem('tgh_tone', document.getElementById('tone').value);
    localStorage.setItem('tgh_provider', document.getElementById('provider').value);
    localStorage.setItem('tgh_rag', document.getElementById('useSearch').checked);
}

export function saveToHistory(topic, text) {
    if (!text || text.includes('[Зупинено]')) return;
    let history = JSON.parse(localStorage.getItem('tgh_history') || '[]');
    history.unshift({ topic, text, date: new Date().toLocaleString('uk-UA') });
    if (history.length > 5) history.pop();
    localStorage.setItem('tgh_history', JSON.stringify(history));
}

export function getHistory() {
    return JSON.parse(localStorage.getItem('tgh_history') || '[]');
}

export function clearHistory() {
    localStorage.removeItem('tgh_history');
}
