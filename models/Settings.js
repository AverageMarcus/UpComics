var mongoose = require("mongoose");

var settingsSchema = new mongoose.Schema({
  name: String,
  value: mongoose.Schema.Types.Mixed
});

var Settings = mongoose.model('Settings', settingsSchema);

module.exports = {
  Settings: Settings
};