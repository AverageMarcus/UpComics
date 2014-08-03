var request = require('request');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Comic = require('./models/comic').Comic;
var moment = require('moment');
var titleHelper = require('./TitleHelper');

var baseMarvelURL = 'http://marvel.com';
var baseImageURL = 'http://imagecomics.com';
var baseDCURL = 'http://www.dccomics.com';

var db = mongoose.connection;

db.on('error', console.error);
db.once('open', function() {
    console.log("We have a database");

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
                        var fullTitle = $(this).text().trim();
                        var link = baseMarvelURL + $(this).find('a').attr('href');
                        //TODO: Fetch date from each page
                        var title = titleHelper.getTitle(fullTitle);
                        var issue = titleHelper.getIssue(fullTitle);

                        var newComic = {
                            title: title,
                            issue: issue,
                            release_date: undefined,
                            publisher: 'Marvel',
                            link : link
                        };

                        Comic.update({ title : newComic.title, publisher: newComic.publisher}, {$set: newComic}, {upsert:true}, function(err, newComic){
                            if (err) return console.error(err);
                        });
                    });
                    now.add(1, 'months');
                    scrapeMarvelComics(now);
                }
            });
        };
        scrapeMarvelComics();
    });

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
                        var date = moment($(this).find('.pub_date').text());
                        var title = titleHelper.getTitle(fullTitle);
                        var issue = titleHelper.getIssue(fullTitle);
                        
                        var newComic = {
                            title: title,
                            issue: issue,
                            release_date: date,
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

                    //TODO: Need to find some way of loading all results
                    var $ = cheerio.load(html);

                    var releases = [];

                    var domComics = $('li .title');
                    if(domComics.length === 0){
                        console.log("Done for now");
                        return;
                    }

                    domComics.each(function(){

                        var fullTitle = $(this).find('a').text().trim();
                        var link = baseImageURL + $(this).find('a').attr('href');
                        var title = titleHelper.getTitle(fullTitle);
                        var issue = titleHelper.getIssue(fullTitle);
                        var date = $(this).find('.onsale').text();
                        date = date.substring(date.lastIndexOf(' ')).trim() + '/2014';
                        date = moment(date);
                       
                        var newComic = {
                            title: title,
                            issue: issue,
                            release_date: date,
                            publisher: 'DC',
                            link : link
                        };

                        Comic.update({ title : newComic.title, publisher: newComic.publisher}, {$set: newComic}, {upsert:true}, function(err, newComic){
                            if (err) return console.error(err);
                        });
                    });
                    now.add(1, 'months');
                    scrapeDCComics(now);
                }
            });
        };
        scrapeDCComics();
    });
});

mongoose.connect('mongodb://localhost/UpComics');