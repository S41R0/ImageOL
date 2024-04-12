document.addEventListener('DOMContentLoaded', function() {
    // Получаем JSON-строку из элемента на странице
    var variable_values_json = document.getElementById('variable_values_json').textContent;
    
    // Заменяем значения NaN на null в JSON-строке
    variable_values_json = variable_values_json.replace(/NaN/g, 'null');
    
    // Парсим JSON-строку в объект JavaScript
    var variable_values = JSON.parse(variable_values_json);
    
    // Выводим содержимое объекта в консоль для проверки
    console.log(variable_values);

});

