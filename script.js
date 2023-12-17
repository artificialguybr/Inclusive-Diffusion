import emojiToText from './emojiMapping.js';

function mapEmojisToText(emojiString) {
    return [...emojiString].map(emoji => emojiToText[emoji] || emoji).join(' ');
}

function handleEmojiClick(thumbnail, index) {
    thumbnail.addEventListener('click', () => handleEmojiSelection(index));
    thumbnail.addEventListener('keypress', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            handleEmojiSelection(index);
        }
    });
}

function handleEmojiSelection(index) {
    showCategory(index);
}

function hideAllCategories() {
    document.querySelectorAll('.emoji-category').forEach(cat => cat.classList.add('hidden'));
}

function showCategory(index) {
    const category = document.getElementById(`emoji-category-${index + 1}`);
    category.classList.remove('hidden');
}

function handleCategoryClick(category) {
    category.addEventListener('click', event => {
        if (isEmojiClicked(event)) {
            addEmojiToInput(event.target);
        }
        event.stopPropagation();
    });
}

function isEmojiClicked(event) {
    return event.target !== event.currentTarget && event.target.classList.contains('emoji');
}

function addEmojiToInput(emojiElement) {
    const selectedEmojisInput = document.getElementById('selected-emojis');
    selectedEmojisInput.value += emojiElement.textContent.trim();

    // Adicione a classe de animação ao emojiElement
    emojiElement.classList.add('emoji-clicked');

    // Remova a classe de animação após a animação ser concluída
    setTimeout(() => {
        emojiElement.classList.remove('emoji-clicked');
    }, 100); // A duração da animação em milissegundos
}

function adjustEmojiGrid() {
    const grids = document.querySelectorAll('.emoji-category div');
    grids.forEach(grid => {
        grid.className = window.innerWidth < 768 ? 'grid grid-cols-3 gap-4' : 'grid grid-cols-6 gap-4';
    });
}

async function query(data) {
    console.log("Sending request to worker with data:", data);
    const requestData = {
        prompt: data.inputs,
        negative_prompt: "bad art, ugly, watermark, deformed", // adicione um valor aqui se necessário
        sync_mode: 1 // ativa o modo síncrono
    };

    const response = await fetch(
        "X", // WORKER URL
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        }
    );
    console.log("Received response from worker");
    if (!response.ok) {
        throw new Error(`Worker call failed: ${response.status}`);
    }
    const result = await response.json(); // Alterado para json
    console.log("Received JSON from worker");
    return result;
}


function toggleButtonState(button, isLoading) {
    button.style.backgroundColor = isLoading ? '#FFA500' : '#007BFF';
    button.disabled = isLoading;
    button.ariaBusy = isLoading;
    document.querySelector('.loading-container').classList.toggle('hidden', !isLoading);
    const imageElement = document.querySelector('.generated-image');
    if (imageElement) {
        imageElement.style.display = isLoading ? 'none' : 'block';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.emoji-thumbnail').forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            const currentCategory = document.getElementById(`emoji-category-${index + 1}`);

            // Toggle the visibility of the current category
            if (currentCategory.style.display === 'none' || currentCategory.style.display === '') {
                // Hide all other categories
                document.querySelectorAll('.emoji-category').forEach(cat => {
                    cat.style.display = 'none';
                });
                // Show the clicked category
                currentCategory.style.display = 'block';
            } else {
                // If the category is already visible, hide it
                currentCategory.style.display = 'none';
            }
        });
    });
});

function handleGenerateClick() {
    const button = document.getElementById('generate-btn');
    button.addEventListener('click', async function() {
        toggleButtonState(this, true);
        
        // Obter emojis selecionados
        const selectedEmojis = document.getElementById('selected-emojis').value;
        
        // Mapear emojis para texto correspondente
        const mappedText = mapEmojisToText(selectedEmojis);

        if (!mappedText.trim()) {
            alert("Please select some emojis first!");
            toggleButtonState(this, false);
            return;
        }

        try {
            // Enviar texto mapeado para a API
            const response = await query({ "inputs": ` ${mappedText}` });
            displayGeneratedImage(response);
        } catch (error) {
            console.error("Error calling the API: ", error);
            alert("Failed to generate image. Please try again.");
        } finally {
            toggleButtonState(this, false);
        }
    });
}


function displayGeneratedImage(responseData) {
    if (responseData.images && responseData.images.length > 0) {
        const imageUrl = responseData.images[0].url;
        const imageElement = document.querySelector('.generated-image');
        if (imageElement) {
            imageElement.src = imageUrl;
            imageElement.style.display = 'block';
        } else {
            console.error('Elemento de imagem não encontrado.');
        }
    } else {
        console.error('Nenhuma imagem encontrada na resposta.');
    }
}


function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = navigator.language || 'en-US';
        recognition.interimResults = false;

        const startSpeechBtn = document.getElementById('start-speech-recognition');
        const selectedEmojisInput = document.getElementById('selected-emojis');

        startSpeechBtn.addEventListener('click', () => {
            if (startSpeechBtn.classList.contains('listening')) {
                recognition.stop();
                startSpeechBtn.classList.remove('listening');
            } else {
                recognition.start();
                startSpeechBtn.classList.add('listening');
            }
        });

        recognition.addEventListener('result', (event) => {
            const transcript = event.results[0][0].transcript;
            selectedEmojisInput.value = transcript;
        });

        recognition.addEventListener('end', () => {
            startSpeechBtn.classList.remove('listening');
        });
    } else {
        console.error("Your browser does not support speech recognition.");
    }
}


document.addEventListener('DOMContentLoaded', function () {
    // Hide the generated image initially
    const imageElement = document.querySelector('.generated-image');
    if (imageElement) {
        imageElement.style.display = 'none';
    }

    document.querySelectorAll('.emoji-thumbnail').forEach(handleEmojiClick);
    document.querySelectorAll('.emoji-category').forEach(handleCategoryClick);
    window.addEventListener('load', adjustEmojiGrid);
    window.addEventListener('resize', adjustEmojiGrid);
    handleGenerateClick();
    setupSpeechRecognition();
});