var express = require('express');
var app = express();
var childprocess = require('child_process');
var api = require('./api');
var firstrun = require('./FirstRun');

var scraper = childprocess.spawn('node', ['scraper.js']);
var restartScraper = function(code){
    console.log('Scraper exited with code ' + code + '. Restarting...');
    scraper = childprocess.spawn('node', ['scraper.js']);
    scraper.on('close', restartScraper);
};
scraper.on('close', restartScraper);

app.set('port', process.env.PORT || 8081);

// Index
app.get('/', function(req, res){
    firstrun.checkFirstRun(req, res, function(req, res){
        res.status(200).end();
    });
});
// All routes
app.all('*', function(req, res, next) {
    // Allow cross origin requests
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
 });
app.all('*', api.validateApiKey);
// First Run
app.get('/firstrun', api.index);
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