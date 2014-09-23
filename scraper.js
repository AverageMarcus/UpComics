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
      if(file !== 'ScraperBase.js'){
        if(process.argv[2]){
          if(file.indexOf(process.argv[2])>=0){
            require("./scrapers/" + file).startNow();
          }
        }else{
          require("./scrapers/" + file).start();
        }
      }
    });

});

mongoose.connect('mongodb://localhost/UpComics');
