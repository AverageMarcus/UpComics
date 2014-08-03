var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var moment = require('moment');

var baseMarvelURL = 'http://marvel.com';
var baseImageURL = 'http://imagecomics.com';
var baseDCURL = 'http://www.dccomics.com';

var db = mongoose.connection;

db.on('error', console.error);
db.once('open', function() {
  var comicSchema = new mongoose.Schema({
      title: {  type: String },
      issue: Number,
      release_date: Date,
      publisher: String,
      link : String
    });

    var Comic = mongoose.model('Comic', comicSchema);

    //Image releases updated every weekday at 6am
    var imageRule = new schedule.RecurrenceRule();
    imageRule.hour = 6;
    imageRule.dayOfWeek = new schedule.Range(1, 5);
    //Marvel releases updated every weekday at 7am
    var marvelRule = new schedule.RecurrenceRule();
    marvelRule.hour = 7;
    marvelRule.dayOfWeek = new schedule.Range(1, 5);
    //Image releases updated every weekday at 8am
    var dcRule = new schedule.RecurrenceRule();
    dcRule.hour = 6;
    dcRule.dayOfWeek = new schedule.Range(1, 5);

    var marvelScrape = schedule.scheduleJob(marvelRule, function(){
        var scrapeMarvelComics = function scrapeMarvelComics(month){
            var now = month || moment();
            var url = baseMarvelURL + '/comics/calendar/month/'+now.display("YYYY-MM-DD");

            request(url, function(error, response, html){
                if(!error){

                    var $ = cheerio.load(html);

                    var domComics = $('.comic-item h5');
                    if(domComics.length === 0){
                        return;
                    }

                    domComics.each(function(){

                        var title = $(this).text().trim();
                        var link = baseMarvelURL + $(this).find('a').attr('href');
                        //TODO: Fetch date from each page

                        var newComic = new Comic({
                            title: title.substring(0, title.lastIndexOf('#')).trim(),
                            issue: title.substring(title.lastIndexOf('#')+1).trim(),
                            release_date: undefined,
                            publisher: 'Marvel',
                            link : link
                        });
                        newComic.save(function(err, newComic){
                            if (err) return console.error(err);
                        });
                    });

                }
            });
        };
        scrapeMarvelComics();
    });


    var imageScrape = schedule.scheduleJob(imageRule, function(){
        var scrapeImageComics = function scrapeImageComics(month){
            var now = month || moment();
            var url = baseImageURL + '/comics/upcoming-releases/'+moment.display("YYYY/D");

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
                        var date = moment($(this).find('.pub_date').text());
                        
                        var newComic = new Comic({
                            title: title.substring(0, title.lastIndexOf('#')).trim(),
                            issue: title.substring(title.lastIndexOf('#')+1).trim(),
                            release_date: date,
                            publisher: 'Image',
                            link : link
                        });
                        newComic.save(function(err, newComic){
                            if (err) return console.error(err);
                        });
                    });
                }
            });
        };
        scrapeImageComics();
    });

    var dcScrape = schedule.scheduleJob(dcRule, function(){
        var scrapeDCComics = function scrapeDCComics(month){
            var now = month || moment();
            var lastDayOfMonth = now.add('months', 1).date(0);
            var url = baseDCURL + '/browse?content_type=comic&date='+now.display("DD")+'/01/'+now.display("YYYY")+'&date_end='+now.display("DD")+'/+'lastDayOfMonth.display("DD")'+/'+now.display("YYYY");

            request(url, function(error, response, html){
                if(!error){

                    var $ = cheerio.load(html);

                    var releases = [];

                    var domComics = $('li .title');
                    if(domComics.length === 0){
                        return;
                    }

                    domComics.each(function(){

                        var title = $(this).find('a').text().trim();
                        var link = baseImageURL + $(this).find('a').attr('href');
                        var date = $(this).find('.onsale').text();
                        date = date.substring(date.lastIndexOf(' ')).trim() + '/2014';
                        date = moment(date);
                       
                        var newComic = new Comic({
                            title: title.substring(0, title.lastIndexOf('#')).trim(),
                            issue: title.substring(title.lastIndexOf('#')+1).trim(),
                            release_date: date,
                            publisher: 'DC',
                            link : link
                        });
                        newComic.save(function(err, newComic){
                            if (err) return console.error(err);
                        });
                    });
                }
            });
        });
    };
    scrapeDCComics();
});

mongoose.connect('mongodb://localhost/UpComics');

exports = module.exports = app;