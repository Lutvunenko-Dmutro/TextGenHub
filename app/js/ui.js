export function showToast(message, type = 'error') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-check-circle"></i>';
    if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function showError(msg) {
    // If it's plain text (no HTML) — use toast. If it has HTML — show in generatedText div directly.
    const hasHTML = /<[a-z][\s\S]*>/i.test(msg);
    if (hasHTML) {
        const resultSection = document.getElementById('resultSection');
        const generatedText = document.getElementById('generatedText');
        if (resultSection && generatedText) {
            resultSection.style.display = 'block';
            generatedText.innerHTML = msg;
            return;
        }
    }
    showToast(msg, 'error');
}

export function updateCounters(text) {
    const textStats = document.getElementById('textStats');
    textStats.style.display = 'flex';
    document.getElementById('charCount').textContent = text.length;
    document.getElementById('wordCount').textContent = text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function setUILocked(locked) {
    document.getElementById('topic').disabled = locked;
    document.getElementById('length').disabled = locked;
    document.getElementById('useSearch').disabled = locked;
    
    document.querySelectorAll('.custom-select').forEach(sel => {
        sel.style.pointerEvents = locked ? 'none' : 'auto';
        sel.style.opacity = locked ? '0.6' : '1';
    });
}

export function setupCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(customSelect => {
        const hiddenInput = document.getElementById(customSelect.dataset.id);
        const options = customSelect.querySelectorAll('.select-items div');
        const selected = customSelect.querySelector('.select-selected');
        const selectedSpan = selected.querySelector('span');

        // Sync visual with hidden input on load
        options.forEach(opt => {
            if (opt.dataset.value === hiddenInput.value) {
                selectedSpan.textContent = opt.textContent;
            }
        });

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.select-items').forEach(otherItems => {
                if (otherItems !== customSelect.querySelector('.select-items')) otherItems.classList.add('select-hide');
            });
            customSelect.querySelector('.select-items').classList.toggle('select-hide');
        });

        options.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedSpan.textContent = opt.textContent;
                hiddenInput.value = opt.dataset.value;
                hiddenInput.dispatchEvent(new Event('change')); // Trigger saveSettings manually
                customSelect.querySelector('.select-items').classList.add('select-hide');
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.select-items').forEach(items => items.classList.add('select-hide'));
    });
}

export function setupModals() {
    const historyModal = document.getElementById('historyModal');
    const closeHistory = document.querySelector('.close-modal');
    closeHistory.addEventListener('click', () => historyModal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === historyModal) historyModal.style.display = 'none'; });
}

export function setupAdvancedToggle() {
    const advToggle = document.getElementById('advancedToggle');
    const advContent = document.getElementById('advancedContent');
    advToggle.addEventListener('click', () => {
        advToggle.classList.toggle('open');
        advContent.style.display = advContent.style.display === 'none' ? 'block' : 'none';
    });
}

export function setupCopyButton() {
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', () => {
        const target = document.getElementById('typeTarget');
        if (!target?.textContent) return;
        navigator.clipboard.writeText(target.textContent).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:#2ecc71;"></i>';
            setTimeout(() => { copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 2000);
        });
    });
}
