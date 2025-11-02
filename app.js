const express = require('express');
const path = require('path');
const session = require('express-session');
const ejsMate = require('ejs-mate');
const connectRedis = require('connect-redis')
const RedisStore = connectRedis(session);
const { redisClient } = require('./utils/redisClient');
const indexRoutes = require('./routes/index');

const secret = process.env.SESSION_SECRET || "HELLO";

const app = express();

const redisSessionStore = new RedisStore({
    client: redisClient,
    prefix: 'chess-session:',
});

const sessionMiddleware = session({
    store: redisSessionStore,
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 30, // 30 days
    },
});

app.use(sessionMiddleware);

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '/views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use('/', indexRoutes); 

module.exports = { app, sessionMiddleware };