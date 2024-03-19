document.getElementById('textGenerationForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Отримання даних з форми
    const topic = document.getElementById('topic').value;
    const length = document.getElementById('length').value;
    const style = document.getElementById('style').value;
    const tone = document.getElementById('tone').value;

    // Генерація тексту
    const generatedText = generateText(length);
    displayGeneratedText(generatedText);
});

function generateText(length) {
    const dummySentences = [
        "Починаючи з простих чисел, розвивати всі гілки математики до теорії ймовірності.",
        "Проблеми життя не можна розв'язати за допомогою тільки розуму; треба мати також велике серце.",
        "Політика - це мистецтво можливого.",
        "Людина повинна розуміти, а не забобони.",
        "Мова - це інструмент, який ми використовуємо для вираження своїх думок та почуттів.",
        "Будьте про що тверді, якісь миті, з головою до принципів, кожен єдиний аспект вашого дня.",
        "Люди, які не ризикують нічим, нічого не роблять, нічого не отримують, не стають нічим.",
        "Краще вміти і не знати, ніж знати і не вміти."
    ];

    let text = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * dummySentences.length);
        text += dummySentences[randomIndex] + ' ';
    }

    return text;
}

function displayGeneratedText(text) {
    const generatedTextDiv = document.getElementById('generatedText');
    generatedTextDiv.textContent = text;
}
