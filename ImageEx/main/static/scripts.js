// Словарь для хранения значений переменных Excel
var excelData = {};

// Переменная для хранения положения изображения (0 - горизонтальное, 1 - вертикальное)
let position_img_vert = 1;

// Переменная для хранения информации о том, был ли выбран пользователем перевернутый текст
let rotateText = false;

// Переменная для хранения выбранного текста для поворота
let selectedTextForRotation = null;

// Функция для добавления полей ввода переменных
function addVariableFields() {
    var numVariables = parseInt(document.getElementById("num_variables").value);
    if (numVariables > 99) {
        numVariables = 99;
        document.getElementById("num_variables").value = 99;
    }
    var container = document.getElementById("variable_fields");
    container.innerHTML = '';  // Очищаем контейнер

    for (var i = 0; i < numVariables; i++) {
        var input = document.createElement("input");
        input.type = "text";
        input.name = "variable_names_" + i;  // Используем индекс для уникальности
        input.placeholder = "Название переменной " + (i+1);
        container.appendChild(input);
    }
}

// Функция для предварительного просмотра изображения
function previewImage(event) {
    var img = document.getElementById('image_preview');
    img.src = URL.createObjectURL(event.target.files[0]);

    // Удаляем предыдущий текст переменной
    var existingText = document.querySelector('.variable_text');
    if (existingText) {
        existingText.remove();
    }

    // Добавляем обработчик события для клика на изображение
    img.addEventListener('click', addVariable);
}

function addVariable(event) {
    // Проверяем, есть ли уже текст переменной на этом месте
    var existingText = document.elementFromPoint(event.clientX, event.clientY);
    if (existingText && existingText.classList.contains('variable_text')) {
        existingText.remove(); // Удаляем текст переменной, если он уже существует
        return;
    }

    // Получаем название переменной от пользователя
    var variableName = prompt("Введите название переменной:");
    if (!variableName) return; // Если пользователь отменил ввод, то ничего не делаем
    
    // Проверяем, есть ли введенное пользователем название переменной в списке variables
    var variables = document.querySelectorAll('.variables .variable label');
    var values = document.querySelectorAll('.variables .variable ul');

    for (var i = 0; i < variables.length; i++) {
        if (variables[i].textContent === variableName) {
            // Если совпадение найдено, вставляем первое значение из values
            var value = values[i].querySelector('li').textContent;
            createVariableText(event, value);
            return;
        }
    }

    // Если название переменной не найдено, запрашиваем у пользователя значение
    var variableValue = prompt("Введите значение переменной:");
    if (!variableValue) return; // Если пользователь отменил ввод, то ничего не делаем
    
    // Создаем текст переменной с введенным значением
    createVariableText(event, variableValue);
}

var variableTextsOnCanvas = [];

// Функция для создания текста переменной на canvas
function createVariableText(event, textContent) {
    // Создаем новый элемент для текста переменной
    var variableText = document.createElement('div');
    variableText.textContent = textContent;
    variableText.classList.add('variable_text'); // Добавляем класс для стилей
    variableText.style.position = 'absolute';
    variableText.style.fontSize = '60px';
    variableText.style.left = (event.offsetX - 40) + 'px'; // Устанавливаем положение текста по горизонтали
    variableText.style.top = (event.offsetY - 37) + 'px'; // Устанавливаем положение текста по вертикали
    
    // Определяем выбранное пользователем положение текста
    var textPosition = document.querySelector('input[name="text_position"]:checked').value;
    
    // Если выбрано вертикальное положение текста
    if (textPosition === "vertical") {
        variableText.style.transform = 'rotate(-90deg)';
        variableText.style.left = (event.offsetX + variableText.offsetHeight - 70) + 'px'; // Устанавливаем положение перевернутого текста по горизонтали
        variableText.style.top = (event.offsetY - variableText.offsetWidth - 60) + 'px'; // Устанавливаем положение перевернутого текста по вертикали
    }
    
    // Добавляем текст переменной в родительский контейнер изображения
    var imgContainer = document.getElementById('image_container');
    imgContainer.appendChild(variableText);

    // Добавляем текст переменной в массив для хранения на canvas
    variableTextsOnCanvas.push(variableText);

    // Добавляем обработчик события для клика на текст переменной
    variableText.addEventListener('click', function() {
        // Сохраняем выбранный текст для поворота
        selectedTextForRotation = variableText;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Получаем JSON-строку из элемента на странице
    var variable_values_json = document.getElementById('variable_values_json').textContent;
    
    // Заменяем значения NaN на null в JSON-строке
    variable_values_json = variable_values_json.replace(/NaN/g, 'null');
    
    // Парсим JSON-строку в объект JavaScript
    var variable_values_json_text = JSON.parse(variable_values_json);
    
    // Выводим содержимое объекта в консоль для проверки
    console.log(variable_values_json_text);

});


async function saveCanvas() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var img = document.getElementById('image_preview');

    // Устанавливаем размеры canvas такие же, как у изображения
    canvas.width = img.width;
    canvas.height = img.height;

    // Получаем все переменные
    var variables = document.querySelectorAll('.variables .variable label');
    var values = document.querySelectorAll('.variables .variable ul');

    // Находим переменную с максимальным количеством значений
    var maxValues = 0;
    var maxIndex = -1;
    for (var j = 0; j < variables.length; j++) {
        if (values[j].querySelectorAll('li').length > maxValues) {
            maxValues = values[j].querySelectorAll('li').length;
            maxIndex = j;
        }
    }

    // Проверяем, есть ли переменные с значениями
    if (maxIndex === -1) {
        alert('Нет переменных с значениями.');
        return;
    }

    // Создаем объект для хранения значений переменных для первого изображения
    var valuesForFirstImage = {};

    // Заполняем объект значениями переменных для первого изображения
    for (var j = 0; j < variables.length; j++) {
        var value = variable_values_json_text[variables[j].textContent][0]; // Используем только первое значение для всех переменных
        valuesForFirstImage[variables[j].textContent] = value;
    }

    // Проходим по каждому изображению
    for (var i = 0; i < maxValues; i++) {
        // Рисуем изображение на canvas
        ctx.drawImage(img, 0, 0);

        // Рисуем тексты переменных на canvas с использованием значений из объекта valuesForFirstImage
        for (var j = 0; j < variables.length; j++) {
            // Находим текст переменной на canvas и обновляем его значение
            var variableText = variableTextsOnCanvas.find(text => text.textContent === variables[j].textContent);
            if (variableText) {
                variableText.textContent = valuesForFirstImage[variables[j].textContent];
            }
        }

        // Рисуем все тексты переменных на canvas
        variableTextsOnCanvas.forEach(function(variableText) {
            ctx.font = '55px Arial'; // Устанавливаем размер и шрифт текста
            ctx.fillStyle = '#000000'; // Устанавливаем цвет текста
            ctx.textBaseline = 'top'; // Устанавливаем базовую линию текста
            ctx.textAlign = 'left'; // Устанавливаем выравнивание текста

            // Проверяем, нужно ли перевернуть текст переменной
            if (variableText.style.transform && variableText.style.transform.includes("rotate(-90deg)")) {
                ctx.translate(variableText.offsetLeft, variableText.offsetTop); // Переводим начало координат к месту текста
                ctx.rotate(-Math.PI / 2); // Поворачиваем контекст на -90 градусов по часовой стрелке
                ctx.fillText(variableText.textContent, -120, +35); // Рисуем текст относительно начала координат
                ctx.rotate(Math.PI / 2); // Возвращаем контекст в исходное положение
                ctx.translate(-variableText.offsetLeft, -variableText.offsetTop); // Возвращаем начало координат в исходное положение
            } else {
                ctx.fillText(variableText.textContent, variableText.offsetLeft, variableText.offsetTop); // Рисуем текст относительно начала координат
            }
        });

        // Создаем ссылку для загрузки изображения
        var link = document.createElement('a');
        link.download = 'image_with_text_' + i + '.png';
        link.href = canvas.toDataURL('image/png');

        // Кликаем по ссылке для загрузки изображения
        link.click();

        // Ждем некоторое время перед следующей итерацией, чтобы избежать проблем с загрузкой
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Очищаем холст перед следующей итерацией
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
