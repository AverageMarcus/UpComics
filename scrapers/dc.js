var Scraper = require('./ScraperBase');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');
var extend = require('util')._extend;

var dc = Object.create(Scraper);
dc.options = {
    'publisher' : 'DC',
    'URL' : 'http://www.dccomics.com/browse?content_type=comic&date=$month/01/$year&date_end=$month/31/$year',
    'monthFormat' : 'MM',
    'yearFormat' : 'YYYY',
    'dayFormat'  : 'DD',
    'scrapeTime' : 6,
    'scrapeMinute' : 0,
    'scrapeFunction' : function(scrapeVars){
        request.post('http://www.dccomics.com/browse_fetch', {
                form:{
                    'action' : 'load_more',
                    'filters[content_type][id]' : 'content_type-1384895294',
                    'filters[content_type][fname]' : 'content_type',
                    'filters[content_type][filter_data]' : scrapeVars.$('[data-filter=content_type]').data('filter-data'),
                    'filters[content_type][cur_value]' : 'comic',
                    'filters[date][filter_data]' : scrapeVars.$('[data-filter=date]').data('filter-data'),
                    'filters[date][cur_value]' : scrapeVars.now.format("MM")+'/01/'+scrapeVars.now.format("YYYY"),
                    'filters[date_end][filter_data]' : scrapeVars.$('[data-filter=date_end]').data('filter-data'),
                    'filters[date_end][cur_value]' : scrapeVars.now.format("MM")+'/31/'+scrapeVars.now.format("YYYY"),
                    'conf[num_per_page]' : '500',
                    'offset' : '0'
                }
            },
            function (error, response, html){
                var nodeComics = JSON.parse(html)['nodes'];
                if(nodeComics.length === 0){
                    scrapeVars.completedCallback();
                    return;
                }
                for(var i=0;i<nodeComics.length;i++){
                    try{
                        var $ = cheerio.load(nodeComics[i]);

                        var fullTitle = $(nodeComics[i]).find('.title a').text().trim();
                        if(fullTitle){
                            var link = 'http://www.dccomics.com' + $(nodeComics[i]).find('.title a').attr('href');
                            var title = titleHelper.getTitle(fullTitle);
                            var issue = titleHelper.getIssue(fullTitle);
                            var release_date = $(nodeComics[i]).find('.onsale').text();
                            release_date = release_date.substring(release_date.lastIndexOf(' ')).trim() + '/2014';
                            release_date = moment(release_date);
                           
                            var newComic = {
                                title: title,
                                issue: issue,
                                release_date: release_date.format('YYYY-MM-DD'),
                                publisher: 'DC',
                                link : link
                            };

                            scrapeVars.addComic(newComic);
                        }
                    }catch (e){
                        scrapeVars.errorCallback(e.message);
                    }
                }
            }
        );
        // Call the next callback that triggers scraping the next month
        scrapeVars.nextCallback();
    }
};

module.exports = dc;

// Call the scraper directly and avoid the scheduler
if(process.argv && process.argv[2] && process.argv[2] == 'start'){
    dc.startNow();
}
