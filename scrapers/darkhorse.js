var request = require('request');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Comic = require('../models/Comic').Comic;
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');

var baseDarkHorseURL = 'http://www.darkhorse.com';

var darkHorseScrape = schedule.scheduleJob({hour: 8, dayOfWeek: new schedule.Range(1, 5)}, function(){
    var scrapeDarkHorseComics = function scrapeDarkHorseComics(page){
        var now = month || moment();
        var url = baseDarkHorseURL + '/Comics/Upcoming?page=';

        request(url, function(error, response, html){
            if(!error){
                var $ = cheerio.load(html);
                
                var pages = $('select[name=page]').first().length;

                for(var i=0;i<= pages;i++){
                    request(url+i, function(error, response, html){
                        if(!error){
                            var $ = cheerio.load(html);
                            var domComics = $('.list_items_container').children();
                            if(domComics.length === 0){
                                return;
                            }
                            var currentDate = "";

                            domComics.each(function(){
                                if($(this).is('h3')){
                                    currentDate = moment.parse($(this).text().trim(), "MMMM DD, YYYY")
                                }
                                if($(this).hasClass('list_item')){
                                    var fullTitle = $(this).find('a').last().text().trim();
                                    var link = baseDarkHorseURL + $(this).find('a').first().attr('href');
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

                                    Comic.update({ title : newComic.title, publisher: newComic.publisher}, {$set: newComic}, {upsert:true}, function(err, newComic){
                                        if (err) return console.error(err);
                                    });
                                }
                                
                            });

                        }
                    });
                }
            }
        });
    };
    scrapeDarkHorseComics();
});

console.log("✔ Dark Horse scraper loaded");