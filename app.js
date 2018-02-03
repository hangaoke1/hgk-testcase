// 引入 mongoose 相关模型
require('./model/user');
require('./model/block');
require('./model/case');
require('./model/tag');
require('./model/user');
// require('./model/role');
// require('./model/privilege');
const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const jwt = require('jsonwebtoken');
const { jwt_secert } = require('./config/index');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const app = express();
const controller = require('./controller/index');
const config = require('./config/index');
// 路由
const index = require('./routes/index');
const block = require('./routes/block');
const tag = require('./routes/tag');
// const user = require('./routes/user');
// const role = require('./routes/role');
// const privilege = require('./routes/privilege');
// 日志初始化
const log4js = require('log4js');
const log4jsConfig = require('./log4js.config.json');
log4js.configure(log4jsConfig);
const logger = log4js.getLogger('app.js');
logger.info('log4js init');
logger.error('error test');
const options = {
  host: config.redis.host,
  port: config.redis.port,
  pass: config.redis.pass,
  prefix: config.redis.prefix,
  logErrors: true
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressValidator());

// 跨域设置
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  // OPTIONS 快速通过
  if (req.method == 'OPTIONS') {
    res.header('Access-Control-Max-Age', 3600 * 24 * 7);
    res.send('200');
  } else if (req.method == 'GET') {
    req.body = req.query;
    next();
  } else {
    next();
  }
});

// 登陆拦截token
app.use(function (req, res, next) {
  if (req.path === '/login') {
    next();
  } else {
    const jwt_token = req.cookies.user;
    if (jwt_token) {
      jwt.verify(jwt_token, jwt_secert, function (err, decoded) {
        if (!err && decoded) {
          req.decoded = decoded;
          next()
        } else {
          res.cookie('user', '', { maxAge: 0 })
          res.cookie('givenName', '', { maxAge: 0 })
          res.cookie('displayName', '', { maxAge: 0 })
          res.json({
            code: 400,
            hasError: true,
            msg: 'token验证失败',
            data: err.message
          }) 
        }
      })
    } else {
      res.json({
        code: 400,
        hasError: true,
        msg: '请先登录',
        data: null
      })
    }
  }
});

app.use('/', index);
app.use('/block', block);
app.use('/tag', tag);
// app.use('/user', user);
// app.use('/role', role);
// app.use('/privilege', privilege);
// login
app.all('/login', controller.user.login);
app.get('/logout', controller.user.logout);
app.get('/getuserinfo', controller.user.getuserinfo);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(404);
  res.render('error');
});

// error handler
app.use(function (err, req, res, next) {
  logger.error(err);
  // const message = err.message;
  const error = req.app.get('env') === 'development' ? err : {};
  res.status(500).json({
    code: 2,
    message: '服务器打酱油去了~',
    error: error.stack
  });
});

module.exports = app;
