var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
  name: String,
  email: String
});

var User = mongoose.model('User', userSchema);

module.exports = {
  User: User
};