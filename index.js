var express = require('express');
var app     = express();
var process = require('child_process');

var scraper = process.spawn('node', ['scraper.js']);
scraper.on('close', function (code) {
  console.log('Scraper exited with code ' + code + '. Restarting...');
  scraper = process.spawn('node', ['scraper.js']);
});

app.get('/', function(req, res){
    res.send(200).end();
});

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;