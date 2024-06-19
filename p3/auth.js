const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Настройка сессий
const session = require('express-session');
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'asda21e2e',
    resave: false,
    saveUninitialized: true,
}))

var { Liquid } = require('liquidjs');
var engine = new Liquid();
// register liquid engine
app.engine('liquid', engine.express());
app.set('views', './views');            // specify the views directory
app.set('view engine', 'liquid');

// Функция для проверки авторизации пользователя
function redirectLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }
    next();
}

// Функция для проверки авторизации пользователя
function checkAuth(req, res, next) {
    if (req.session && req.session.user) {
        next(); // Пользователь авторизован, продолжаем
    } else {
        res.render('not-auth'); // Пользователь не авторизован, перенаправляем на страницу отказа доступа
    }
}

app.get('/', redirectLogin, (req, res) => {
    res.render('user-info', {
        result: req.session.user?.name,
        role: req.session.role
    });
})


// Маршрут для страницы входа
app.get('/login', (req, res) => {
    res.render('login');
})

// Выдача ролей при логининге
app.post('/login', (req, res) => {

    if (req.body.username == 'admin' && req.body.password == '123' || req.body.username == 'neUser' && req.body.password == '123') {
        req.session.role = 'admin';
        req.session.user = {
            name: req.body.username
        }

    } else {
        req.session.role = 'user';
        req.session.user = {
            name: req.body.username,
            role: req.session.role
        }
    }
    const { username, password } = req.body;
    const role = req.session.role;
    const userData = { username, password, role };

    if (fs.existsSync('userData.json')) {
        let arrayFromFile = [];
        const fileContent = fs.readFileSync('userData.json', 'utf8');//read the file
        if (fileContent.trim() !== '') {
            arrayFromFile = JSON.parse(fileContent);//if file is not empy - parse
            if (arrayFromFile.find(item => item.username === username)) {
            }
            else {
                arrayFromFile.push(userData); //+ new element
                fs.writeFileSync('userData.json', JSON.stringify(arrayFromFile, null, 2));
            }
        }
    }
    res.redirect('/user-info');
})

// Маршрут для страницы информации о пользователе
app.get('/user-info', checkAuth, (req, res) => {
    res.render('user-info', {
        result: req.session.user?.name,
        role: req.session.role
    });
});

// Маршрут для страницы списка пользователей (доступ только для админа)
app.get('/user-list', checkAuth, (req, res) => {
    const { username, password } = req.body;
    const role = req.session.role;
    const userData = { username, password, role };
    if (role === 'admin') {
        if (fs.existsSync('userData.json')) {
            let arrayFromFile = [];
            const fileContent = fs.readFileSync('userData.json', 'utf8');//read the file
            if (fileContent.trim() !== '') {
                arrayFromFile = JSON.parse(fileContent);//if file is not empy - parse
            }
            res.render('user-list', {
                result: arrayFromFile
            });
        }
        // Здесь может быть логика для вывода списка пользователей       
    } else {
        res.redirect('/access-denied');
    }
});

// Маршрут для страницы отсутствия доступа
app.get('/access-denied', (req, res) => {
    res.render('access-denied');
});

// Выход из сессии (удаление сессии)
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            res.sendStatus(500); // Ошибка сервера
            return;
        }
        res.redirect('/login'); // Перенаправление на страницу входа
    });
});


app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});