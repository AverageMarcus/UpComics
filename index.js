var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var childprocess = require('child_process');
var api = require('./api');
var firstrun = require('./FirstRun');
var engines = require('consolidate');

var scraper = childprocess.spawn('node', ['scraper.js']);
var restartScraper = function(code){
    console.log('Scraper exited with code ' + code + '. Restarting...');
    scraper = childprocess.spawn('node', ['scraper.js']);
    scraper.on('close', restartScraper);
};
scraper.on('close', restartScraper);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.engine('html', engines.ejs);
app.set('view engine', 'html');
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
app.get('/firstrun', firstrun.index);
app.post('/firstrun', firstrun.submit);
// Publisher
app.get('/publisher/:publisher', api.recordQueries, api.getByPublisher);
app.get('/publisher/:publisher/count', api.recordQueries, api.countByPublisher);
// Date
app.get('/date/:date', api.recordQueries, api.getComicsByDate);
app.get('/date/:date/count', api.recordQueries, api.countComicsByDate);
app.get('/today', api.recordQueries, api.getTodaysReleases);
app.get('/today/count', api.recordQueries, api.countTodaysReleases);
app.get('/thisweek', api.recordQueries, api.getThisWeeksReleases);
app.get('/thisweek/count', api.recordQueries, api.countThisWeeksReleases);
// Series
app.get('/series/:series', api.recordQueries, api.getBySeries);
app.get('/series/:series/count', api.recordQueries, api.countBySeries);
// Advanced search
app.get('/search', api.recordQueries, api.advancedSearch);

app.listen(app.get('port'));
console.log('Magic happens on port ' + app.get('port'));
exports = module.exports = app;