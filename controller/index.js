/**
 * 统一接口管理
 * author hgaoke
 * 2018/1/10
 */
const block = require('./block.js');
const tag = require('./tag.js');
const user = require('./user.js');
// const role = require('./role.js');
// const privilege = require('./privilege.js');
module.exports = {
  user,
  block,
  tag,
  // role,
  // privilege
};
