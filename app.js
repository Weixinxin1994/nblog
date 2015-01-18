var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');

var session = require('express-session');
var partials = require('express-partials');
var config= require('./config');
var MongoStore = require('connect-mongo')(session);
var _ = require('lodash');
var flash = require('connect-flash');
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});

var routes = require('./routes/index');
var auth = require('./middlewares/auth');//after routes
var app = express();

// view engine setup
app.engine('.html', require('ejs').__express); 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(partials());

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan('dev'));
app.use(morgan('combined', {stream: accessLog}));
app.use(bodyParser.json({limit:'1mb'}));
app.use(bodyParser.urlencoded({extended: true, limit:'1mb'}));
app.use(cookieParser(config.session_secret));

app.use(compress());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(flash());

app.use(session({
  secret: config.session_secret,
  store: new MongoStore({
    url: config.url
  }),
  resave: true,
  saveUninitialized: true,
}));

app.use(auth.authUser);

//set static, dynamic helpers
_.extend(app.locals, {
  config: config
});
app.use('/', routes);


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });  
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
