var request = require('request');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Comic = require('../models/Comic').Comic;
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');

var baseMarvelURL = 'http://marvel.com';

var marvelScrape = schedule.scheduleJob({hour: 7, dayOfWeek: new schedule.Range(1, 5)}, function(){
    var scrapeMarvelComics = function scrapeMarvelComics(month){
        var now = month || moment();
        var url = baseMarvelURL + '/comics/calendar/month/'+now.format("YYYY-MM-01");

        request(url, function(error, response, html){
            if(!error){

                var $ = cheerio.load(html);

                var domComics = $('.comic-item h5');
                if(domComics.length === 0){
                    return;
                }

                domComics.each(function(){
                    (function($comic){
                        var fullTitle = $comic.text().trim();
                        var link = baseMarvelURL + $comic.find('a').attr('href');
                        var release_date = undefined;
                        request(link, function(error, response, html){
                            var $$ = cheerio.load(html);
                            release_date = moment($$(this).find('.featured-item-meta').text().trim().substr($$(this).find('.featured-item-meta').text().trim().indexOf('Published: ')+11, $$(this).find('.featured-item-meta').text().trim().indexOf('\n')).trim());

                            var title = titleHelper.getTitle(fullTitle);
                            var issue = titleHelper.getIssue(fullTitle);

                            var newComic = {
                                title: title,
                                issue: issue,
                                release_date: release_date.format('YYYY-MM-DD'),
                                publisher: 'Marvel',
                                link : link
                            };

                            Comic.update({ title : newComic.title, publisher: newComic.publisher}, {$set: newComic}, {upsert:true}, function(err, newComic){
                                if (err) return console.error(err);
                            });
                        });
                    }($(this)));
                });
                now.add(1, 'months');
                scrapeMarvelComics(now);
            }
        });
    };
    scrapeMarvelComics();
});

console.log("✔ Marvel scraper loaded");