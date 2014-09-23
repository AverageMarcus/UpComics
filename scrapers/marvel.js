var scraper = require('./ScraperBase');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');
var extend = require('util')._extend;

var baseURL = 'http://marvel.com';
var options = {
    'publisher' : 'Marvel',
    'URL' : baseURL+'/comics/calendar/month/$year-$month-01',
    'monthFormat' : 'MM',
    'yearFormat' : 'YYYY',
    'dayFormat'  : 'DD',
    'scrapeTime' : 7,
    'scrapeMinute' : 0,
    'scrapeFunction' : function($, addComic, nextCallback, errorCallback, completedCallback){
        var domComics = $('.comic-item h5');
        if(domComics.length === 0){
            completedCallback();
            return;
        }

        domComics.each(function(){
            (function($comic){
                var fullTitle = $comic.text().trim();
                console.log("Found "+fullTitle);
                var link = baseURL + $comic.find('a').attr('href').trim();
                var release_date = undefined;
                request(link, function(error, response, html){
                    try{
                        console.log("Getting more information from "+link+" for "+fullTitle);
                        var $$ = cheerio.load(html);
                        var meta_text = $$('.featured-item-meta').text();
                        var release_date_index = meta_text.trim().indexOf('Published:')+11;
                        var release_date_end_index = meta_text.trim().indexOf('\n');
                        var release_date_text = meta_text.trim().substr(release_date_index, release_date_end_index).trim();
                        release_date = moment(release_date_text);

                        var title = titleHelper.getTitle(fullTitle);
                        var issue = titleHelper.getIssue(fullTitle);

                        var newComic = {
                            title: title,
                            issue: issue,
                            release_date: release_date.format('YYYY-MM-DD'),
                            publisher: 'Marvel',
                            link : link
                        };
                        
                        addComic(newComic);
                    }catch (e){
                        errorCallback(e.message);
                    }
                });
            }($(this)));
        });
        nextCallback();
    }
};

exports.start = function(opts){
    if(opts){
        options = extend(options, opts); 
    }
    scraper.scraper(options);
};

exports.startNow = function(){
    var opts = { 
        'scrapeTime' : parseInt(moment().format('H')),
        'scrapeMinute' : parseInt(moment().format('m'))+1
    }
    options = extend(options, opts); 
    scraper.scraper(options);
};

if(process.argv && process.argv[2] && process.argv[2] == 'start'){
    exports.startNow();
}
