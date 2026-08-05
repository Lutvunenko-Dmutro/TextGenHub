const form = document.getElementById('textGenerationForm');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
const generatedTextDiv = document.getElementById('generatedText');
const copyBtn = document.getElementById('copyBtn');

// Розширений словник фраз
const dictionary = {
    formal: [
        "З огляду на сучасні тенденції розвитку, варто зазначити важливість цього аспекту.",
        "Комплексний підхід до вирішення даної проблеми забезпечує стабільний результат.",
        "Емпіричні дослідження підтверджують високу ефективність запропонованої методології.",
        "Систематизація наявних даних дозволяє виявити ключові закономірності процесу.",
        "Реалізація стратегії вимагає детального аналізу всіх супутніх факторів та ризиків."
    ],
    casual: [
        "Загалом, це виглядає досить круто, якщо розібратися.",
        "Насправді, все набагато простіше, ніж здається на перший погляд.",
        "Я б сказав, що це просто фантастична ідея для старту.",
        "Якщо чесно, ми можемо зробити це набагато краще разом.",
        "Головне — не зупинятися на досягнутому і рухатися вперед."
    ],
    creative: [
        "Немов спалах наднової, ця думка осяює незвідані горизонти уяви.",
        "У лабіринтах свідомості народжуються ідеї, здатні змінити плин часу.",
        "Кожне слово — це пензель, що малює картину нескінченних можливостей.",
        "Ми стоїмо на порозі відкриттів, де мрії переплітаються з реальністю.",
        "Як шепіт вітру в кронах дерев, натхнення приходить непомітно, але залишає слід."
    ]
};

const toneModifiers = {
    neutral: "",
    friendly: " До речі, маю надію, що це буде вам корисно! 😊",
    professional: " Безумовно, це вимагає найвищого рівня експертизи.",
    humorous: " І якщо це не спрацює, завжди можна спробувати перезавантажити комп'ютер! 😅"
};

const loadingPhrases = [
    "Ініціалізація нейромережі...",
    "Аналіз семантичного ядра...",
    "Синтез креативних патернів...",
    "Генерація лінгвістичних структур...",
    "Фіналізація результату..."
];

// Змінна для зберігання інтервалу typewriter
let typewriterInterval;

form.addEventListener('submit', function(event) {
    event.preventDefault();

    // Блокуємо кнопку
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span>Обробка...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

    // Отримання даних з форми
    const topic = document.getElementById('topic').value;
    const length = parseInt(document.getElementById('length').value);
    const style = document.getElementById('style').value;
    const tone = document.getElementById('tone').value;

    // Підготовка UI
    resultSection.style.display = 'block';
    loader.style.display = 'flex';
    generatedTextDiv.innerHTML = '';
    
    // Скидання іконки копіювання
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';

    // Анімація лоадера
    let phraseIndex = 0;
    loaderText.textContent = loadingPhrases[phraseIndex];
    
    const loaderInterval = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
        loaderText.textContent = loadingPhrases[phraseIndex];
    }, 600);

    // Імітація запиту до API (затримка)
    setTimeout(() => {
        clearInterval(loaderInterval);
        loader.style.display = 'none';
        
        // Відновлення кнопки
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span>Згенерувати текст</span> <i class="fa-solid fa-bolt"></i>';

        // Генерація тексту
        const rawText = generateText(topic, length, style, tone);
        
        // Запуск typewriter ефекту
        typeWriterEffect(rawText);
        
        // Плавний скрол до результату
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 2500); // 2.5 секунди затримки для ефекту "роботи ШІ"
});

function generateText(topic, length, style, tone) {
    let sentences = dictionary[style];
    if (!sentences) sentences = dictionary.formal;

    let text = `<strong style="color: var(--primary-color)">Тема: ${topic}</strong><br><br>`;
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        text += sentences[randomIndex] + ' ';
    }
    
    // Додаємо модифікатор тону в кінці
    if (toneModifiers[tone]) {
        text += toneModifiers[tone];
    }

    return text;
}

function typeWriterEffect(htmlContent) {
    // Очищаємо попередній інтервал, якщо він ще працює
    if (typewriterInterval) clearInterval(typewriterInterval);
    
    // Використовуємо тимчасовий елемент для парсингу HTML, щоб не друкувати теги посимвольно
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    generatedTextDiv.innerHTML = '<span class="cursor"></span>';
    
    let i = 0;
    // Отримуємо тільки текст, але нам потрібно зберегти HTML структуру (як <strong>)
    // Для простоти в цьому демо, ми просто вставляємо текст з тегами миттєво,
    // а сам сгенерований контент друкуємо.
    
    // Більш проста реалізація Typewriter для HTML:
    generatedTextDiv.innerHTML = '';
    
    const textContent = tempDiv.innerText || tempDiv.textContent;
    const htmlPrefix = `<strong style="color: var(--primary-color)">Тема: ${document.getElementById('topic').value}</strong><br><br>`;
    
    generatedTextDiv.innerHTML = htmlPrefix + '<span id="typeTarget"></span><span class="cursor"></span>';
    const target = document.getElementById('typeTarget');
    
    // Друкуємо тільки текст після заголовка
    const textToType = textContent.replace(`Тема: ${document.getElementById('topic').value}`, '').trim();
    
    typewriterInterval = setInterval(() => {
        if (i < textToType.length) {
            target.textContent += textToType.charAt(i);
            i++;
        } else {
            clearInterval(typewriterInterval);
            // Прибираємо курсор після завершення
            document.querySelector('.cursor').style.display = 'none';
        }
    }, 20); // Швидкість друку
}

// Функція копіювання
copyBtn.addEventListener('click', () => {
    const textToCopy = document.getElementById('typeTarget').textContent;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #2ecc71;"></i>';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 2000);
    });
});
