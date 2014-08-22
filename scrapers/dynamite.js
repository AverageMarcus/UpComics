var request = require('request');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Comic = require('../models/Comic').Comic;
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');

var baseDynamiteURL = 'http://www.dynamite.com';

var dynamiteScrape = schedule.scheduleJob({hour: 10, dayOfWeek: new schedule.Range(1, 5)}, function(){
    console.log("About to scrape Dynamite comics");
    var scrapeDynamiteComics = function scrapeDynamiteComics(month){
        var now = month || moment();
        var url = baseDynamiteURL + '/htmlfiles/previews.html?getMonth='+now.format("MMMM")+'&getYear='+now.format("YYYY");
        console.log("Scraping "+url);
        request(url, function(error, response, html){
            if(error) console.error(error);
            if(!error){
                console.log("Got a response");

                var $ = cheerio.load(html);

                var domComics = $('#indexPlacement tr[align=left]');
                if(domComics.length === 0){
                    console.log("Done for now");
                    return;
                }
                var i = 0;
                domComics.each(function(){
                    var fullTitle = $(this).find('strong').text().trim();
                    var link = baseDynamiteURL + $(this).find('a').first().attr('href');
                    var release_date = moment(html.match(/ON SALE DATE: ([\w]+ [\d+])/i)[i++] + now.format(" YYYY"));
                    var title = titleHelper.getTitle(fullTitle);
                    var issue = titleHelper.getIssue(fullTitle);
                    
                    var newComic = {
                        title: title,
                        issue: issue,
                        release_date: release_date.format('YYYY-MM-DD'),
                        publisher: 'Dynamite',
                        link : link
                    };

                    Comic.update({ title : newComic.title, publisher: newComic.publisher}, {$set: newComic}, {upsert:true}, function(err, newComic){
                        if (err) return console.error(err);
                    });
                });
                now.add(1, 'months');
                scrapeDynamiteComics(now);
            }
        });
    };
    scrapeDynamiteComics();
});

console.log("✔ Dynamite scraper loaded");