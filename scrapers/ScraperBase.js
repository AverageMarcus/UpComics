var request = require('request');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Comic = require('../models/Comic').Comic;
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');



var errorHandler = function(err){
  console.error("ERROR: " + err);
};

var completedCallback = function(){
  console.log("Scrape completed");
};

var addComic = function(newComic){
  Comic.update({ title : newComic.title, publisher: newComic.publisher, issue: newComic.issue}, {$set: newComic}, {upsert:true}, function(err, comicsUpdated){
      if(err) errorHandler(err);
      console.log("Added "+newComic.title+" #"+newComic.issue +" by "+newComic.publisher);
  });
};

exports.scraper = function(options, errorCallback){
  var errorCallback = errorCallback || errorHandler;

  if(!options.publisher 
    || !options.URL
    || !options.monthFormat
    || !options.yearFormat
    || !options.dayFormat 
    || !options.scrapeFunction
    || !options.scrapeTime
    || !options.scrapeMinute){
    errorCallback("Missing required options");
    return;
  }
  
  console.log("Initialised "+options.publisher+" scraper. Hour="+options.scrapeTime+" Minute="+options.scrapeMinute);

  var scheduledTask = schedule.scheduleJob({hour: options.scrapeTime, minute: options.scrapeMinute, dayOfWeek: new schedule.Range(1, 5)}, function(){
    console.log("Beginning scrape of "+options.publisher);
    
    var scrapeComics = function scrapeComics(month){
      var now = month || moment();
      var URL = options.URL.replace('$day', now.format(options.dayFormat)).replace('$month', now.format(options.monthFormat)).replace('$year', now.format(options.yearFormat));
      
      var nextCallback = function(){
        now.add(1, 'months');
        scrapeComics(now);
      };
      
      request(URL, function(error, response, html){
          if(error){
            errorCallback(error);
          }
          if(response.statusCode === 200){
            console.log("Scraping "+URL);
            var $ = cheerio.load(html);
            
            options.scrapeFunction($, addComic, nextCallback, errorCallback, completedCallback);
            
          }else if(response.statusCode === 404){
            console.log(URL+" not found, assuming end of scrape");
          }
      });
      
    };
  
    scrapeComics();
  
  });
};
