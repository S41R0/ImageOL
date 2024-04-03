from django.shortcuts import render
import pandas as pd

def main(request):
    error_message = None
    variable_values = None

    if request.method == 'POST':
        num_variables = int(request.POST.get('num_variables', 0))
        variable_names = []

        # Получаем названия переменных из запроса
        for i in range(num_variables):
            variable_name = request.POST.get(f'variable_names_{i}', '')
            if variable_name:
                variable_names.append(variable_name)

        # Получаем файл Excel
        excel_file = request.FILES.get('excel_file')

        if variable_names and excel_file:
            try:
                # Читаем файл Excel
                df = pd.read_excel(excel_file)

                # Проверяем, что все переменные есть в столбцах файла Excel
                missing_variables = [var for var in variable_names if var not in df.columns]
                if missing_variables:
                    error_message = f"Переменные {', '.join(missing_variables)} не найдены в файле Excel."
                    print(error_message)
                # Если все переменные есть в столбцах файла Excel, передаем их значения в шаблон
                else:
                    variable_values = {var: df[var].tolist() for var in variable_names}
                    print(variable_values)
                    

            except Exception as e:
                error_message = "Ошибка при обработке файла Excel."

    return render(request, 'index.html', {'error_message': error_message, 'variable_values': variable_values})

def text(request):
    return render(request, 'text.html')