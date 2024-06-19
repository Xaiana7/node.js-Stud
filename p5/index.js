const express = require('express');
const clientDB = require('./db')
const cookieParser = require('cookie-parser')
const app = express();
var { Liquid } = require('liquidjs');
var engine = new Liquid();
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


// register liquid engine
app.engine('liquid', engine.express());
app.set('views', './views');            // specify the views directory
app.set('view engine', 'liquid');

clientDB.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Error connecting to PostgreSQL', err));


function checkAuth(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }
    next();
}

app.get('/', checkAuth, (req, res) => {
    res.render('index');
})

app.get('/login', (req, res) => {
    res.render('login');
})

//дописать проверку в таблице, проверить добавление
app.post('/login', async (req, res) => {
    req.session.user = {
        name: req.body.username
    }
    const { username, password } = req.body;
    console.log(username);
    try {
        // Выполнение запроса на добавление ссылки в таблицу в базе данных
        const result = await clientDB.query('SELECT EXISTS(SELECT 1 FROM users WHERE lgn = $1 AND pswd = $2)', [username, password]);
        if (result.rows[0].exists) {
            console.log('Founded 1 user:', { username, password });
            res.redirect('/index');
        } else {
            console.log(1);
            const add = await clientDB.query('INSERT INTO users (lgn, pswd) VALUES ($1, $2) RETURNING *', [username, password]);
            console.log('New user added', add.rows[0]);
            res.redirect('/index')
        }
    } catch (error) {
        console.error('Error adding to database:', error);
        res.render('error');
    }
})

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

app.get('/list', async (req, res) => {
    const r = await clientDB.query('select * from "links"');
    res.render('list', { rows: r.rows });
})

app.get('/index', checkAuth, async (req, res) => {
    res.render('index', {
        name: req.session.user?.name
    });
})

app.use(express.urlencoded({ extended: true }));

app.post('/submit-link', async (req, res) => {
    const link = req.body.link;
    try {
        // Выполнение запроса на добавление ссылки в таблицу в базе данных
        const result = await clientDB.query('INSERT INTO links (link) VALUES ($1) RETURNING *', [link]);
        console.log('Link added to database:', result.rows[0]);
        res.render('resultId', { id: result.rows[0].id, link: result.rows[0].link });
    } catch (error) {
        console.error('Error adding link to database:', error);
        res.render('resultId', { id: 'Error adding link to database', link: 'http://localhost:3000/index' });
    }
})

app.post('/delete-link', async (req, res) => {
    const link = req.body.linkToDel;
    try {
        const result = await clientDB.query('DELETE FROM links WHERE link = $1', [link]);
        console.log('Link deleted from database');
        const r = await clientDB.query('select * from "links"');
        res.render('list', { rows: r.rows });
    }
    catch {

    }
})
app.listen(3000, () => console.log('Server started on port: 3000'));
