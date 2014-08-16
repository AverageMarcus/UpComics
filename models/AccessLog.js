var mongoose = require("mongoose");

var accessLogSchema = new mongoose.Schema({
  user : { type: String },
  date : { type: Date, default: Date.now },
  path : String,
  query: mongoose.Schema.Types.Mixed
});

var AccessLog = mongoose.model('AccessLog', accessLogSchema);

module.exports = {
  AccessLog: AccessLog
};