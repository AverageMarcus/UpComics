var Scraper = require('./ScraperBase');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');
var extend = require('util')._extend;

var darkHorse = Object.create(Scraper);
darkHorse.options = {
    'publisher' : 'DarkHorse',
    'URL' : 'http://www.darkhorse.com/Comics/Upcoming?page=',
    'monthFormat' : 'MM',
    'yearFormat' : 'YYYY',
    'dayFormat'  : 'DD',
    'scrapeTime' : 8,
    'scrapeMinute' : 0,
    'scrapeFunction' : function(scrapeVars){
        var pages = scrapeVars.$('select[name=page]').first().length;

        var processPage = function processPage(pageUrl){
            request(pageUrl, function(error, response, html){
                if(error) scrapeVars.errorCallback(error);
                var $$ = cheerio.load(html);
                var domComics = $$('.list_items_container').children();
                if(domComics.length === 0){
                    scrapeVars.completedCallback();
                    return;
                }
                var currentDate = "";

                domComics.each(function(){
                    if($$(this).is('h3')){
                        currentDate = moment($$(this).text().trim(), "MMMM DD, YYYY");
                    }
                    if($$(this).hasClass('list_item')){
                        var fullTitle = $$(this).find('.product_link').text().trim();
                        console.log("Found "+fullTitle);
                        var link = 'http://www.darkhorse.com' + $$(this).find('a').first().attr('href');
                        var release_date = currentDate;
                        var title = titleHelper.getTitle(fullTitle);
                        var issue = titleHelper.getIssue(fullTitle);

                        var newComic = {
                            title: title,
                            issue: issue,
                            release_date: release_date.format('YYYY-MM-DD'),
                            publisher: 'Dark Horse',
                            link : link
                        };

                        scrapeVars.addComic(newComic);
                    }
                    
                });
            });
        };

        for(var i=0;i<= pages;i++){
            console.log("Fetching "+options.URL+i);
            processPage(options.URL+i);
        }
        // We call the complete callback rather than the next 
        // callback as we handle each month in the above loop
        scrapeVars.completedCallback();
    }
};

module.exports = darkHorse;

// Call the scraper directly and avoid the scheduler
if(process.argv && process.argv[2] && process.argv[2] == 'start'){
    exports.startNow();
}
