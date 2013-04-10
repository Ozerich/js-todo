var TODO = {};

TODO.Helper = {

    // Проверяет, является ли параметр числом
    isNumber: function (o) {
        return !(o instanceof Date) && !isNaN(o - 0) && o !== null && o !== "" && o !== false;
    },

    // Проверяет, является ли параметр строкой
    isString: function (o) {
        return typeof o == 'string' || o instanceof String;
    },

    // Конвертирует параметр типа Date в строку
    dateToStr: function (date) {
        if (date instanceof Date === false) return "Invalid Date";

        function to2(val) {
            return val.toString().length == 1 ? '0' + val : val.toString().substr(0, 2);
        }

        return to2(date.getDate()) + '.' + to2(date.getMonth() + 1) + '.' + date.getFullYear() + ' ' + to2(date.getHours()) + ':' + to2(date.getMinutes());
    },

    // Конвертирует дату, которая является разницей между двумя датами в строку
    dateDiffToStr: function (date) {
        if (date instanceof Date === false) return "Invalid Date";

        var str = '';

        if (date.getDate() > 0) {
            str += date.getDate() + ' ' + (date.getDate() % 10 == 1 ? 'день' : (date.getDate() % 10 >= 2 && date.getDate() % 10 <= 4 ? 'дня' : 'дней')) + ', ';
        }

        if (date.getHours() > 0) {
            str += date.getHours() + ' ' + (date.getHours() % 10 == 1 ? 'час' : (date.getHours() % 10 >= 2 && date.getHours() % 10 <= 4 ? 'часа' : 'часов')) + ', ';
        }

        if (date.getMinutes() > 0) {
            str += date.getMinutes() + ' ' + (date.getMinutes() % 10 == 1 ? 'минута' : (date.getMinutes() % 10 >= 2 && date.getMinutes() % 10 <= 4 ? 'минуты' : 'минут')) + ', ';
        }

        // Обрезает лишную запятую в конце результата
        str = str.trim();
        if (str.charAt(str.length - 1) === ',') {
            str = str.substring(0, str.length - 1);
        }

        return str;
    }

};

// Универсальный загрузчик
TODO.DataPointGate = function (_url) {
    var url = _url;

    // Главная функция, осуществляет запрос к API, выполняя заппрос _command, параметры запроса _params
    this.Request = function (_command, _params, _callback, _errorCallback) {

        if (_command.toString().length === 0) {
            throw "Команда не может быть пустая";
        }

        if (_params === undefined) {
            _params = {};
        }

        if (_callback === undefined) {
            _callback = function () {
            };
        }

        if (_errorCallback === undefined) {
            _errorCallback = function () {
            };
        }

        // Проверка на JSON формат
        if (TODO.Helper.isString(_params)) {
            _params = $.parseJSON(_params);

            if (_params === null) {
                throw "Параметры должны быть в формате JSON";
            }
        }

        // Ajax GET запрос к API
        $.getJSON(url + _command + '.php', _params,function (_response) {
            _callback(_response);
        }).error(function () {
                _errorCallback();
            });
    }

};


// Datapoint, вспомогательный класс для загрузки данных
TODO.DataPoint = {

    // создается объект загручика
    _dataPointGate: new TODO.DataPointGate('http://rygorh.dev.monterosa.co.uk/todo/'),

    // Получить все типы задач
    GetTypes: function (_callback, _errorCallback) {
        this._dataPointGate.Request("types", {}, _callback, _errorCallback);
    },

    // Получить все задачи
    GetItems: function (_callback, _errorCallback) {
        this._dataPointGate.Request("items", {}, _callback, _errorCallback);
    }
};


TODO.Models = {};

// Модель для Типа
TODO.Models.Type = function (id, name) {

    // ID типа
    var _id;

    this.setId = function (_value) {

        if (!TODO.Helper.isNumber(_value)) {
            throw "ID типа должен быть числом";
        }

        _id = _value;
    };

    this.getId = function () {
        return _id;
    };


    // Имя типа
    var _name;

    this.setName = function (_value) {
        _value = _value.toString();

        if (_value.length === 0) {
            throw "Имя типа ен может быть пустым";
        }

        _name = _value;
    };

    this.getName = function () {
        return _name;
    };


    // Инициализация свойств
    this.setName(name);
    this.setId(id);
};

// Переопределение toString, для того чтобы задача выводила своё название в тех местах, когда ожидается строка
TODO.Models.Type.prototype.toString = function () {
    return this.getName();
};

// Модель для задачи
TODO.Models.Task = function () {

    // Название задачи
    var _name;

    this.setName = function (_value) {
        _value = _value.toString();

        if (_value.length === 0) {
            throw "Имя задачи не может быть пустым";
        }

        _name = _value;
    };

    this.getName = function () {
        return _name;
    };


    // Тип задачи
    var _type;

    this.setType = function (_value) {
        if (!_value instanceof TODO.Models.Type) {
            throw "Тип должен являться TODO.Models.Type";
        }

        _type = _value;
    };

    this.getType = function () {
        return _type;
    };


    // Выполнена ли задача true/false
    var _done = ko.observable(false);

    this.done = ko.computed({
        read: function () {
            return _done();
        },
        write: function (_value) {
            _done(_value ? true : false);
        }
    });

    // Дата создания задачи
    var _created_at = ko.observable();

    this.created_at = ko.computed({
        read: function () {
            return _created_at();
        },
        write: function (_value) {
            _created_at(TODO.Helper.isNumber(_value) ? new Date(_value * 1000) : new Date(_value));
        }
    });


    // Дата завершения
    var _expires_at = ko.observable();

    this.expires_at = ko.computed({
        read: function () {
            return _expires_at();
        },
        write: function (_value) {
            _expires_at(TODO.Helper.isNumber(_value) ? new Date(_value * 1000) : new Date(_value));
        }
    });

    // Оставшееся время
    this.remainingTime = ko.computed({
        read: function () {
            var diff = new Date(new Date() - this.expires_at());

            return TODO.Helper.dateDiffToStr(diff);
        }
    }, this);
};

// Главная ViewModel
TODO.ViewModel = function () {
    var that = this;

    // флаг, о том что идет загрузка
    this.isLoading = ko.observable(false);

    // ошибка загрузки
    that.loadingError = ko.observable();

    // Массив с типами задач
    this.types = ko.observableArray();

    // Добавляет новый тип
    this.addType = function (_type) {

        // Проверка на то, чтобы добавляемый объект был именно моделью Типа
        if (!_type instanceof TODO.Models.Type) {
            throw "Тип должен иметь тип данных Type";
        }

        // Если проверка прошла, то добавляем тип в массив
        this.types.push(_type);
    };

    // Выбранное значение типа в фильтре
    this.selectedFilterType = ko.observable();

    // Выбранное значение Сделано/Не сделано в фильтре
    this.selectedFilterDone = ko.observable();


    // Значение типа в форме добавления задачи
    this.newType = ko.observable();

    // Значение названия задачи в форме добавления задачи
    this.newTask = ko.observable();

    // Вспомогательные переменные, для обозначения даты и времени завершения задачи в форме добавления задачи
    this.newExpiresAtTime = ko.observable();
    this.newExpiresAtDate = ko.observable();

    // Значение даты завершения задачи в форме добавления задачи
    this.newExpiresAt = ko.computed({
        read: function () {
            var date = this.newExpiresAtDate();
            var time = this.newExpiresAtTime();

            // И время и дата должны быть введены
            if (!date || !time) return null;

            // Собираем строку с датой из даты и времени и возвращаем объект Date
            return new Date(date + ' ' + time);
        },
        write: function (_value) {
            // При ресете _value == null и надо обнулить вспомогательные переменные, для того чтобы в инпутах значения очистились
            if (!_value) {
                this.newExpiresAtDate(null);
                this.newExpiresAtTime(null);
            }
        }

    }, this);

    // Текст ошибки валидации в форме добавления задачи
    this.submitError = ko.observable();

    // Обработчик нажатия на кнопку "Добавить" в форме добавления задачи
    this.submitAdd = function () {

        // Скидываем ошибку перед началом валидации
        that.submitError('');

        // Валидация поля с именем задачи, должна содержать хотя бы один символ
        if (that.newTask().toString().length === 0) {
            that.submitError('Введите задачу');
            return;
        }

        // Валидация поля с типом задачи, тип должен быть выбран
        if (that.newType() === undefined) {
            that.submitError('Выберите тип задачи');
            return;
        }

        // Валидация поля с датой завершения задачи, должна быть введена дата и время
        if (!that.newExpiresAt()) {
            that.submitError('Выберите дату завершения');
            return;
        }

        // Создание модели для Задачи
        var model = new TODO.Models.Task();

        // Инициализация свойств из формы
        model.setType(that.newType());
        model.setName(that.newTask());
        model.expires_at(that.newExpiresAt());

        // Дата создания - текущее время
        model.created_at(new Date());

        // Добавляем задачу в массив
        that.addTask(model);

        // Делаем ресет формы добавления задачи
        that.newTask('');
        that.newType('');
        that.newExpiresAt(null);
    };


    // Вспомогательная функция для поиска Типа по его ID
    this.findTypeById = function (_id) {
        var result = null;

        // foreach по массиву с типами
        ko.utils.arrayForEach(this.types(), function (type) {

            // Если найден нужный, записываем в результат, прекращаем итерацию
            if (type.getId() == _id) {
                result = type;
                return false;
            }
        });

        return result;
    };


    // Список с задачами
    this.tasks = ko.observableArray();

    // Задачи после применения фильтра
    this.filteredTasks = ko.computed(function () {

        // foreach по массиву с задачами
        return ko.utils.arrayFilter(this.tasks(), function (_task) {

            // Проверка на фильтр Типа
            if (that.selectedFilterType() !== undefined && _task.getType().getId() !== that.selectedFilterType())return false;

            // Проверка на фильтр Сделано/Не сделано
            else if (that.selectedFilterDone() !== undefined && _task.done() != that.selectedFilterDone()) return false;

            return true;
        })
            // После фильтра делаем сортировку по дате завершения
            .slice().sort(function (left, right) {
                return left.expires_at() < right.expires_at() ? -1 : 1;
            });

    }, this);


    // Добавляет задачу в хранилище
    this.addTask = function (_task) {

        // Проверка, на то, что задача является объектом именно модели Задача
        if (!_task instanceof TODO.Models.Task) {
            throw "Тип должен иметь тип данных Task";
        }

        // Добавляем в хранилище задачу
        this.tasks.push(_task);
    };


    // Функция для загрузки данных из API
    this.loadData = function () {

        // Устаналиваем флаг загрузки
        that.isLoading(true);

        // Скидываем ошибку загрузки
        that.loadingError('');

        // Получаем типы задач
        TODO.DataPoint.GetTypes(function (data) {

            // Проход по результату
            for (var i = 0, len = data.length; i < len; i++) {
                var item = data[i];

                // Проверка на то, что результат имеет тот формат, который мы ожидаем
                if (item.id !== undefined && item.name !== undefined) {
                    // Добавляет тип в хранилище
                    that.addType(new TODO.Models.Type(item.id, item.name));
                }
            }

            // После получения и обработки типов задач, загружаем задачи
            TODO.DataPoint.GetItems(function (data) {

                // Проход по результату
                for (var i = 0, len = data.length; i < len; i++) {
                    var _item = data[i];

                    // Ищем в хранилище тип с ID который имеет загруженная задача
                    var type = that.findTypeById(_item.type);

                    // Если такого типа не найдено, то переходим к следующей задаче
                    if (!type)continue;

                    // Создание модели для загруженной Задачи
                    var model = new TODO.Models.Task();

                    // Инициализация свойств
                    model.setName(_item.task);
                    model.setType(type);
                    model.done(_item.done);
                    model.created_at(_item.created_at);
                    model.expires_at(_item.expires_at);

                    // Добавляем в хранилище
                    that.addTask(model);

                    // Скидываем флаг загрузки
                    that.isLoading(false);
                }

            }, function () {
                // Если загрузка задач не удалась, то скидываем флаг загрузки и пишем ошибку
                that.isLoading(false);
                that.loadingError("Ошибка загрузки задач");
            });

        }, function () {
            // Если загрузка типов не удалась, то скидываем флаг загрузки и пишем ошибку
            that.isLoading(false);
            that.loadingError("Ошибка загрузки типов");
        });

    };

    // Инициализация: загрузка данных
    this.loadData();
};

// При загрузки страницы, связать страницу с ViewModel
function applyBindings() {
    ko.applyBindings(new TODO.ViewModel());
}

// Вешаем событие связывание ViewModel с DOM тогда, когда DOM загрузится
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', applyBindings, false);
}
else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', applyBindings);
}
else {
    window.onload = applyBindings;
}