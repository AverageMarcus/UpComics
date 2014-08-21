var request = require('request');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Comic = require('../models/Comic').Comic;
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');

var baseImageURL = 'http://imagecomics.com';

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

                var releases = [];

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
