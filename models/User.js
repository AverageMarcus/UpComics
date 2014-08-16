var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
  name: String,
  email: String,
  is_superhero: Boolean,
  log : mongoose.Schema.Types.Mixed
});

var User = mongoose.model('User', userSchema);

module.exports = {
  User: User
};