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




var imageScrape = schedule.scheduleJob({hour: 6, dayOfWeek: new schedule.Range(1, 5)}, function(){
    console.log("About to scrape Image comics");
    var scrapeImageComics = function scrapeImageComics(month){
        var now = month || moment();
        var url = baseImageURL + '/comics/upcoming-releases/'+now.format("YYYY/M");
        console.log("Scraping "+url);
        request(url, function(error, response, html){
            if(error) console.error(error);
            if(!error){
                console.log("Got a response");

                var $ = cheerio.load(html);

                var domComics = $('.release_box .right');
                if(domComics.length === 0){
                    console.log("Done for now");
                    return;
                }

                domComics.each(function(){

                    var fullTitle = $(this).find('h1').text().trim();
                    var link = baseImageURL + $(this).find('h1').find('a').attr('href');
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

                    Comic.update({ title : newComic.title, publisher: newComic.publisher}, {$set: newComic}, {upsert:true}, function(err, newComic){
                        if (err) return console.error(err);
                    });
                });
                now.add(1, 'months');
                scrapeImageComics(now);
            }
        });
    };
    scrapeImageComics();
});

console.log("✔ Image scraper loaded");