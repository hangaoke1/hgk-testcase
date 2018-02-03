/**
 * 用户controller
 * 登陆/退出/查询
 * author hgaoke
 * 2018/1/10
 */
const ldap = require('../service/ldap');
const logger = require('log4js').getLogger('controller/user.js');
const mongoose = require('../db/mongoClient.js');
const User = mongoose.model('User');
const { jwt_secert } = require('../config/index');
const jwt = require('jsonwebtoken');
module.exports = {
  async login(req, res) {
    try{
      req.checkBody({
        account: {
          notEmpty: true,
          errorMessage: '账号不能为空'
        },
        password: {
          notEmpty: true,
          errorMessage: '密码不能为空'
        }
      });
      const valErrs = req.validationErrors();
      if (valErrs[0]) {
        const msg = valErrs[0].msg;
        return res.status(200).json({
          code: 1,
          msg: msg,
          data: null
        });
      }
      const account = req.body.account;
      const password = req.body.password;
      const state = await ldap.loginAsync({
        account,
        password
      });
      let userMsg = await ldap.getUserInfoAsync({
        account
      });
      const remember_me = 2592000000;
      const { uid, givenName, displayName } = userMsg;
      const token = jwt.sign({ uid, givenName, displayName }, jwt_secert, {expiresIn: 60 * 60 * 24 * 30 });
      res.cookie('user', token, { maxAge: remember_me })
      res.cookie('givenName', givenName, { maxAge: remember_me })
      res.cookie('displayName', displayName, { maxAge: remember_me })
      res.json({
        code: 0,
        msg: '登录成功',
        data: token
      });
    }catch(error) {
      logger.error(error);
      res.json({
        code: 1,
        msg: '用户名或密码错误',
        data: null
      });
    }
  },
  logout(req, res) {
    res.cookie('user', '', { maxAge: 0 });
    res.cookie('givenName', '', { maxAge: 0 });
    res.cookie('displayName', '', { maxAge: 0 });
    res.json({
      code: 0,
      msg: '退出成功',
      data: null
    });
  },
  getuserinfo(req, res) {
    res.json({
      code: 0,
      msg: '查询成功',
      data: req.decoded
    });
  },
  add (req, res) {
    // 入参校验待添加
    req.checkBody({
      name: {
        notEmpty: true,
        errorMessage: '用户名不能为空'
      },
      user_id:{
        notEmpty: true,
        errorMessage: 'user_id不能为空'
      }
    });
    const valErrs = req.validationErrors();
    if (valErrs[0]) {
      const msg = valErrs[0].msg;
      return res.status(200).json({
        code: 1,
        msg: msg,
        data: null
      });
    }

    var name = req.body.name,
      user_id = req.body.user_id,
      user_mobile = req.body.user_mobile,
      user_email = req.body.user_email,
      user_photo = req.body.user_photo;
    var role = req.body.role ? req.body.role.split(',') : [];

    var operator = {
      uid: req.session.user.uid,
      name: req.session.user.givenName + req.session.user.displayName
    };
    var data = new User();
    data.name = name;
    data.user_mobile = user_mobile;
    data.user_email = user_email;
    data.user_photo = user_photo;
    data.role = role;
    data.first_operator = operator;
    data.last_operator = operator;

    co(function* () {
      const user = yield data.save();
      res.json({
        code: 0,
        msg: '用户新增成功',
        data: user
      });
    }).catch(error => {
      logger.error(error);
      res.json({
        code: 1,
        msg: '用户新增错误',
        data: error.message
      });
    });
  },
  remove (req, res) {
    const userId = req.body.id;
    co(function* () {
      yield User.update({_id: userId}, {$set: {status: 0}});
      res.json({
        code: 0,
        msg: '用户删除成功',
        data: userId
      });
    }).catch(error => {
      logger.error(error);
      res.json({
        code: 1,
        msg: '用户删除错误',
        data: error.message
      });
    });
  },
  update (req, res) {},
  query (req, res) {
    co(function* () {
      const users = yield User.find({status: 1}).populate({
        path: 'role',
        match: {
          status: 1
        }
      });
      res.json({
        code: 0,
        msg: '用户查询成功',
        data: users
      });
    }).catch(error => {
      logger.error(error);
      res.json({
        code: 1,
        msg: '用户查询错误',
        data: error.message
      });
    });
  }
};
