/**
 * 模块模型
 * author 
 * 2018/1/24
 */
const mongoose = require('../db/mongoClient.js');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema({
  name:String,
  user_id:String,
  user_mobile:String,
  user_email:String,
  user_photo:String,
  role:[{ type: ObjectId, ref: 'Role'}],
  status: {
    type: Number,
    default: 1
  },
  first_operator: {
    uid: String,
    name: String
  },
  last_operator: {
    uid: String,
    name: String
  },
  create_time: {
    type: Date,
    default: Date.now
  },
  update_time: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false,
  timestamps: {
    createdAt: 'create_time',
    updatedAt: 'update_time'
  }
});
// 名字不允许重复
UserSchema.path('name').validate({
  isAsync: true,
  validator: function(value, respond) {
    this.model('User').count({ name: value }, function(err, count) {
      if (count > 0) {
        respond(false);
      } else {
        respond(true);
      }
    });
  },
  message: '姓名重复'
});
const User = mongoose.model('User', UserSchema);
module.exports = User;