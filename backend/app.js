require('dotenv').config()
require('./models/connection')


var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fileUpload = require("express-fileupload");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var gamesRouter = require('./routes/games');
var scenesRouter = require('./routes/scenes');
var exportsRouter = require('./routes/exports');



var app = express();

const cors = require('cors')
app.use(cors())

app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/games', gamesRouter);
app.use('/scenes', scenesRouter);
app.use('/exports', exportsRouter);

app.get("/", (req, res) => {
    res.send("Bienvenue sur l'API True Story 🎉");
  });
  


module.exports = app;
