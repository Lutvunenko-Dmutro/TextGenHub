<div align="center">

# TextGenHub (Local Ollama Version) 🪄

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

*Потужний локальний веб-застосунок для генерації тексту без цензури та лімітів за допомогою Ollama.*

</div>

## 📖 Про проєкт

**TextGenHub** — це веб-застосунок, який дозволяє згенерувати текст на основі обраної теми, бажаної довжини, стилю та тону. Ця версія адаптована спеціально для **локального використання**. Вона взаємодіє з встановленим на вашому комп'ютері сервером [Ollama](https://ollama.com/), що забезпечує максимальну конфіденційність (дані не передаються стороннім компаніям).

У разі, якщо Ollama недоступна, система автоматично пропонує запасний варіант (Fallback) — виконання моделей через **WebGPU** безпосередньо у пам'яті вашого браузера.

### 🌟 Що нового:
1. **Гібридний підхід:** Пріоритет віддається Ollama (порт 11434). Якщо вона вимкнена, автоматично пропонується запуск міні-моделей Llama 3.2 1B через WebGPU.
2. **RAG (Пошук в інтернеті):** Підтримка Python-бекенду (`server.py`) для пошуку актуальної інформації через DuckDuckGo.
3. **Модульна архітектура:** Код реструктуризовано на дрібні JS-модулі (`api.js`, `llm.js`, `ui.js`, `storage.js`).
4. **Історія генерацій:** Усі згенеровані тексти автоматично зберігаються в LocalStorage.

---

## 🚀 Як запустити 

Оскільки проєкт використовує ES6-модулі (`import / export`) та RAG-сервер, просто відкрити `index.html` недостатньо.

**Крок 1: Встановлення залежностей**
У вас має бути встановлений Python та Ollama. Завантажте улюблену модель, наприклад `llama3.2`:
```bash
ollama run llama3.2
```

**Крок 2: Налаштування Ollama (важливо)**
Щоб браузер міг звертатися до Ollama (уникнення помилки CORS), виконайте в PowerShell:
```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
```

**Крок 3: Запуск локального сервера TextGenHub**
Відкрийте другий термінал у папці проєкту та запустіть Python-сервер (або просто клікніть `start_server.bat`):
```bash
python server.py
```

**Крок 4: Використання**
Перейдіть у браузері за адресою `http://localhost:8000/app/index.html`. Насолоджуйтесь швидкою, приватною генерацією текстів!

---

## 📂 Структура проєкту

- `/app/index.html` — Головна сторінка застосунку.
- `/app/css/` — Стилі, розбиті на компоненти.
- `/app/js/` — Модульна логіка:
  - `main.js` — Головний контролер.
  - `llm.js` — Відповідає за роботу WebGPU як Fallback.
  - `api.js` — Взаємодія з Ollama API та RAG-сервером.
  - `storage.js` — Збереження історії та налаштувань.
- `server.py` — Python-сервер для роздачі сторінки та RAG.
