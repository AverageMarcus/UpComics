var mongoose = require('mongoose');

var baseMarvelURL = 'http://marvel.com';
var baseImageURL = 'http://imagecomics.com';
var baseDCURL = 'http://www.dccomics.com';
var baseDarkHorseURL = 'http://www.darkhorse.com';

var db = mongoose.connection;

db.on('error', console.error);
db.once('open', function() {
    console.log("We have a database");

    require("fs").readdirSync("./scrapers").forEach(function(file) {
      require("./scrapers/" + file);
    });

});

mongoose.connect('mongodb://localhost/UpComics');