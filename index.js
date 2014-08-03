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

app.set('port', process.env.PORT || 8081);

app.get('/', function(req, res){
    res.status(200).end();
});


app.all('*', api.validateApiKey);
// Publisher
app.get('/publisher/:publisher/count', api.countByPublisher);
// Date
app.get('/date/:date', api.getComicsByDate);
app.get('/today', api.getTodaysReleases);
app.get('/thisweek', api.getThisWeeksReleases);
// Series
app.get('/series/:series', api.getBySeries);

app.listen(app.get('port'));
console.log('Magic happens on port ' + app.get('port'));
exports = module.exports = app;