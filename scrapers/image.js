var Scraper = require('./ScraperBase');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');
var extend = require('util')._extend;

var image = Object.create(Scraper);
image.options = {
    'publisher' : 'Image',
    'URL' : 'http://imagecomics.com/comics/upcoming-releases/$year/$month',
    'monthFormat' : 'M',
    'yearFormat' : 'YYYY',
    'dayFormat'  : 'DD',
    'scrapeTime' : 4,
    'scrapeMinute' : 0,
    'scrapeFunction' : function(scrapeVars){
        var domComics = $('.release_box .right');
        if(domComics.length === 0){
            scrapeVars.completedCallback();
            return;
        }

        domComics.each(function(){
            try{
                var fullTitle = $(this).find('h1').text().trim();
                var link = 'http://imagecomics.com' + $(this).find('h1').find('a').attr('href');
                var release_date = moment($(this).find('.pub_date').text());
                var title = titleHelper.getTitle(fullTitle);
                var issue = titleHelper.getIssue(fullTitle);
                
                var newComic = {
                    title: title,
                    issue: issue,
                    release_date: release_date.format('YYYY-MM-DD'),
                    publisher: 'Image',
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

module.exports = image;

// Call the scraper directly and avoid the scheduler
if(process.argv && process.argv[2] && process.argv[2] == 'start'){
    image.startNow();
}