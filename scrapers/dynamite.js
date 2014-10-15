var Scraper = require('./ScraperBase');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');
var extend = require('util')._extend;

var dynamite = Object.create(Scraper);
dynamite.options = {
    'publisher' : 'Dynamite',
    'URL' : 'http://www.dynamite.com/htmlfiles/previews.html?getMonth=$month&getYear=$year',
    'monthFormat' : 'MMMM',
    'yearFormat' : 'YYYY',
    'dayFormat'  : 'DD',
    'scrapeTime' : 5,
    'scrapeMinute' : 0,
    'scrapeFunction' : function(scrapeVars){
        var domComics = scrapeVars.$('#indexPlacement tr[align=left]');
        if(domComics.length === 0){
            scrapeVars.completedCallback();
            return;
        }
        var i = 0;
        domComics.each(function(){
            try{
                var fullTitle = $(this).find('strong').text().trim();
                var link = 'http://www.dynamite.com' + $(this).find('a').first().attr('href');
                var release_date = moment(html.match(/ON SALE DATE: ([\w]+ [\d+])/i)[i++] + scrapeVars.now.format(" YYYY"));
                var title = titleHelper.getTitle(fullTitle);
                var issue = titleHelper.getIssue(fullTitle);
                
                var newComic = {
                    title: title,
                    issue: issue,
                    release_date: release_date.format('YYYY-MM-DD'),
                    publisher: 'Dynamite',
                    link : link
                };

                scrapeVars.addComic(newComic);
            }catch (e){
                scrapeVars.errorCallback(e.message);
            }
        });
        // Call the next callback that triggers scraping the next month
        scrapeVars.nextCallback();
    }
};

module.exports = dynamite;

// Call the scraper directly and avoid the scheduler
if(process.argv && process.argv[2] && process.argv[2] == 'start'){
    dynamite.startNow();
}