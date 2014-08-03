var express = require('express');
var app     = express();
var process = require('child_process');
var api = require('./api');

var scraper = process.spawn('node', ['scraper.js']);
var restartScraper = function(code){
	console.log('Scraper exited with code ' + code + '. Restarting...');
	scraper = process.spawn('node', ['scraper.js']);
	scraper.on('close', restartScraper);
};
scraper.on('close', restartScraper);

app.get('/', function(req, res){
    res.status(200).end();
});

app.get('/publisher/:publisher/count', api.countByPublisher);
app.get('/date/:date', api.getComicsByDate);
app.get('/today', api.getTodaysReleases);
app.get('/thisweek', api.getThisWeeksReleases);

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;