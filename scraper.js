var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var schedule = require('node-schedule');

var baseMarvelURL = 'http://marvel.com';
var baseImageURL = 'https://imagecomics.com';

//Marvel releases updated every weekday at 7am
var marvelRule = new schedule.RecurrenceRule();
marvelRule.hour = 7;
marvelRule.dayOfWeek = new schedule.Range(1, 5);
//Image releases updated every weekday at 6am
var imageRule = new schedule.RecurrenceRule();
imageRule.hour = 6;
imageRule.dayOfWeek = new schedule.Range(1, 5);

var marvelScrape = schedule.scheduleJob(marvelRule, function(){

    var url = baseMarvelURL + '/comics/calendar/month/2014-08-01';

    request(url, function(error, response, html){
        if(!error){

            var $ = cheerio.load(html);

            var releases = [];

            var domComics = $('.comic-item h5');
            if(domComics.length === 0){
                return;
            }

            domComics.each(function(){

                var title = $(this).text().trim();
                var link = baseMarvelURL + $(this).find('a').attr('href');

                var comic = {
                    title: title,
                    link: link,
                    date: undefined
                };

                releases.push(comic);
            });

            //TODO: save to/update database

        }
    });

});


var imageScrape = schedule.scheduleJob(imageRule, function(){

    var url = baseImageURL + '/comics/upcoming-releases/2014/8';

    request(url, function(error, response, html){
        if(!error){

            var $ = cheerio.load(html);

            var releases = [];

            var domComics = $('.release_box .right');
            if(domComics.length === 0){
                return;
            }

            domComics.each(function(){

                var title = $(this).find('h1').text().trim();
                var link = baseImageURL + $(this).find('h1').find('a').attr('href');
                var date = $(this).find('.pub_date').text();

                var comic = {
                    title: title,
                    link: link,
                    date: date
                };

                releases.push(comic);
                console.log(comic);
            });

            //TODO: save to/update database

        }
    });
});


exports = module.exports = app;