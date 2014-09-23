var scraper = require('./ScraperBase');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');
var extend = require('util')._extend;

var baseURL = 'http://www.darkhorse.com';
var options = {
    'publisher' : 'DarkHorse',
    'URL' : baseURL+'/Comics/Upcoming?page=',
    'monthFormat' : 'MM',
    'yearFormat' : 'YYYY',
    'dayFormat'  : 'DD',
    'scrapeTime' : 8,
    'scrapeMinute' : 0,
    'scrapeFunction' : function($, addComic, nextCallback, errorCallback, completedCallback){
        
        var pages = $('select[name=page]').first().length;

        for(var i=0;i<= pages;i++){
            console.log("Fetching "+options.URL+i);
            request(options.URL+i, function(error, response, html){
                if(error) errorCallback(error);
                var $$ = cheerio.load(html);
                var domComics = $$('.list_items_container').children();
                if(domComics.length === 0){
                    completedCallback();
                    return;
                }
                var currentDate = "";

                domComics.each(function(){
                    if($$(this).is('h3')){
                        currentDate = moment($$(this).text().trim(), "MMMM DD, YYYY")
                    }
                    if($$(this).hasClass('list_item')){
                        var fullTitle = $$(this).find('.product_link').text().trim();
                        console.log("Found "+fullTitle);
                        var link = baseURL + $$(this).find('a').first().attr('href');
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

                        addComic(newComic);
                    }
                    
                });
            });
        }
        completedCallback();
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
