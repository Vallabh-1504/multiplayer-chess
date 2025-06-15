const express = require('express');
const path = require('path');
const indexRoutes = require('./routes/index');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/views'));

app.use('/', indexRoutes); 

module.exports = app;
