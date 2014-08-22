var request = require('request');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Comic = require('../models/Comic').Comic;
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');

var baseDCURL = 'http://www.dccomics.com';

var dcScrape = schedule.scheduleJob({hour: 5, dayOfWeek: new schedule.Range(1, 5)}, function(){
    console.log("About to scrape DC comics");
    var scrapeDCComics = function scrapeDCComics(month){
        var now = month || moment();
        var lastDayOfMonth = now.add(1, 'months').date(0);
        var url = baseDCURL + '/browse?content_type=comic&date='+now.format("MM")+'/01/'+now.format("YYYY")+'&date_end='+now.format("MM")+'/'+lastDayOfMonth.format("DD")+'/'+now.format("YYYY");
        console.log("Scraping "+url);
        request(url, function(error, response, html){
            if(error) console.error(error);
            if(!error){
                console.log("Got a response");
                
                var $ = cheerio.load(html);

                request.post(baseDCURL + '/browse_fetch', {form:{
                    'action' : 'load_more',
                    'filters[content_type][id]' : 'content_type-1384895294',
                    'filters[content_type][fname]' : 'content_type',
                    'filters[content_type][filter_data]' : $('[data-filter=content_type]').data('filter-data'),
                    'filters[content_type][cur_value]' : 'comic',
                    'filters[date][filter_data]' : $('[data-filter=date]').data('filter-data'),
                    'filters[date][cur_value]' : now.format("MM")+'/01/'+now.format("YYYY"),
                    'filters[date_end][filter_data]' : $('[data-filter=date_end]').data('filter-data'),
                    'filters[date_end][cur_value]' : now.format("MM")+'/'+lastDayOfMonth.format("DD")+'/'+now.format("YYYY"),
                    'conf[num_per_page]' : '500',
                    'offset' : '0'
                }}, function (error, response, html){
                    var nodeComics = JSON.parse(html)['nodes'];
                    if(nodeComics.length === 0){
                        console.log("Done for now");
                        return;
                    }
                    for(var i=0;i<nodeComics.length;i++){
                        var $ = cheerio.load(nodeComics[i]);

                        var fullTitle = $(nodeComics[i]).find('.title a').text().trim();
                        if(fullTitle){
                            var link = baseImageURL + $(nodeComics[i]).find('.title a').attr('href');
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

                            Comic.update({ title : newComic.title, publisher: newComic.publisher}, {$set: newComic}, {upsert:true}, function(err, newComic){
                                if (err) return console.error(err);
                            }); 
                        }                            
                    }
                });

                now.add(1, 'months');
                scrapeDCComics(now);
            }
        });
    };
    scrapeDCComics();
});

console.log("✔ DC scraper loaded");