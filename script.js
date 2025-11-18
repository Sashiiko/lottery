// --- ИНИЦИАЛИЗАЦИЯ И КОНФИГУРАЦИЯ ---
const scratchCanvas = document.getElementById('scratchCanvas');
const scratchCtx = scratchCanvas.getContext('2d'); // Контекст для маски и стирания

const prizeCanvas = document.getElementById('prizeCanvas');
const prizeCtx = prizeCanvas.getContext('2d'); // Контекст для изображения-приза

let isScratching = false; 
const scratchRadius = 25; // Размер "ластика"

// ОГРАНИЧЕНИЯ РАЗМЕРА: Максимальная ширина, которую мы разрешаем
const maxWidth = 500; 
const maxHeight = 400; // Ограничение по высоте

// 1. Объект изображения
const hiddenImage = new Image();
hiddenImage.src = 'img/prize.jpg'; 

// --- ЛОГИКА ЗАГРУЗКИ И РИСОВАНИЯ ---
hiddenImage.onload = function() {
    let imgWidth = hiddenImage.width;
    let imgHeight = hiddenImage.height;

    // --- ЛОГИКА МАСШТАБИРОВАНИЯ ---
    // Сначала масштабируем по ширине, если она превышает лимит
    if (imgWidth > maxWidth) {
        imgHeight = (maxWidth / imgWidth) * imgHeight;
        imgWidth = maxWidth;
    }
    // Затем масштабируем по высоте, если она все еще превышает лимит
    if (imgHeight > maxHeight) {
        imgWidth = (maxHeight / imgHeight) * imgWidth;
        imgHeight = maxHeight;
    }

    // Шаг 1: Устанавливаем размеры ОБОИХ Canvas по новым масштабированным размерам
    scratchCanvas.width = imgWidth;
    scratchCanvas.height = imgHeight;
    prizeCanvas.width = imgWidth;
    prizeCanvas.height = imgHeight;
    
    // Шаг 2: Рисуем скрытое изображение ТОЛЬКО на нижнем Canvas (prizeCanvas)
    prizeCtx.drawImage(hiddenImage, 0, 0, imgWidth, imgHeight);
    
    // Шаг 3: Рисуем маску ТОЛЬКО на верхнем Canvas (scratchCanvas)
    drawMask(imgWidth, imgHeight);
};

function drawMask(width, height) {
    // Рисуем маску на ВЕРХНЕМ Canvas (scratchCtx)
    scratchCtx.fillStyle = '#AAAAAA'; 
    scratchCtx.fillRect(0, 0, width, height);
}

// --- ФУНКЦИИ СТИРАНИЯ И ОБРАБОТЧИКИ СОБЫТИЙ ---

function getMousePos(event) {
    // Получает координаты мыши/пальца относительно ВЕРХНЕГО Canvas
    const rect = scratchCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y };
}

function scratch(event) {
    if (!isScratching) return;

    // Определяем позицию, используя либо мышь, либо первый палец (touch)
    const pos = getMousePos(event.touches ? event.touches[0] : event);

    // Устанавливаем режим 'destination-out' для ВЕРХНЕГО Canvas (scratchCtx)
    scratchCtx.globalCompositeOperation = 'destination-out';
    
    // Рисуем круг (наш ластик)
    scratchCtx.beginPath();
    scratchCtx.arc(pos.x, pos.y, scratchRadius, 0, 2 * Math.PI);
    scratchCtx.fill();
    
    // Сбрасываем режим
    scratchCtx.globalCompositeOperation = 'source-over'; 
}

function startScratching(event) {
    isScratching = true;
    scratch(event);
}

function stopScratching() {
    isScratching = false;
    checkScratchProgress();
}

// --- ОБРАБОТЧИКИ СОБЫТИЙ (Привязаны к ВЕРХНЕМУ Canvas) ---
scratchCanvas.addEventListener('mousedown', startScratching);
scratchCanvas.addEventListener('mouseup', stopScratching);
scratchCanvas.addEventListener('mouseleave', stopScratching);
scratchCanvas.addEventListener('mousemove', scratch);

scratchCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    startScratching(e);
}, false);

scratchCanvas.addEventListener('touchend', stopScratching, false);

scratchCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
    scratch(e);
}, false);

// --- ПРОВЕРКА ПРОГРЕССА (ОПЦИОНАЛЬНО) ---
function checkScratchProgress() {
    // Проверяем прозрачность на ВЕРХНЕМ Canvas (маске)
    const imageData = scratchCtx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
    const pixelData = imageData.data;
    let totalPixels = pixelData.length / 4;
    let revealedPixels = 0;

    // Считаем прозрачные пиксели
    for (let i = 3; i < pixelData.length; i += 4) {
        if (pixelData[i] === 0) { // alpha-канал = 0 (прозрачный)
            revealedPixels++;
        }
    }

    const percentage = (revealedPixels / totalPixels) * 100;

    if (percentage > 90) { 
        // Очищаем верхний Canvas, чтобы показать весь приз.
        scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);

        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.style.visibility = 'visible';
            messageElement.innerText = `Поздравляем! Вы стёрли ${Math.round(percentage)}% изображения!`;
        }
    }
}