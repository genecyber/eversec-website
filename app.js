var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var NodeSession = require('node-session');
var router = express.Router();
var serveIndex = require('serve-index');

var dust = require('express-dustjs')

dust._.optimizers.format = function (ctx, node) {
 return node
}

dust._.helpers.demo = function (chk, ctx, bodies, params) {
 return chk.w('demo')
}

var nodeSession = new NodeSession({
  'secret': process.env.secret,
  'driver': 'memory',
  'lifetime': 3600000, // 5 minutes
  'expireOnClose': false,
  /*Session Cookie Name*/
  'cookie': 'session',

  'encrypt': true
});

function session(req, res, next){
  nodeSession.startSession(req, res, next);
}

var app = express();
app.use(session);


// Use Dustjs as Express view engine 
app.engine('dust', dust.engine({
  // Use dustjs-helpers 
  useHelpers: true
}))
app.set('view engine', 'dust')
app.set('views', path.resolve(__dirname, './views'))


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'public')));

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use(function (req, res, next) {
  if (req.session.has('user')) {
      var username = req.session.get('user');
      
      if (username == 'admin') {
        res.message = 'Welcome admin';
        res.authStatus = 'GOOD';
      } else {
        res.message = 'BAD';
        res.message = 'Access denied. '+ username + ' is not an authorized employee.';
      }
  } else {
      var guestid = 'guest' + Math.floor(Math.random()*899999+100000);
      req.session.set('user', guestid);            
      res.message = 'Access denied. '+ guestid + ' is not an authorized employee.';
  }

  next();
});


app.get('/', function(req, res, next) {
  // view is at views/index.dust
  res.render('index', {
    msg: res.message
  })
});


app.get('/consultants', function(req, res, next){
  // TODO (bug reported) -  A syntax error gets thrown when a user enters certain characters.. investigate this later, for now use simple passwords
    res.render('consultants', {
      password: req.query.password
    })
});

app.get('/about', function(req, res, next){
  res.render('about');
})

app.get('/eaccess', function(req, res, next){
  res.render('eaccess', { msg: res.message, auth: res.authStatus });
})

module.exports = app;
