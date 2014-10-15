var request = require('request');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Comic = require('../models/Comic').Comic;
var Settings = require('../models/Settings').Settings;
var moment = require('moment');
var titleHelper = require('../utils/titleHelper');
var extend = require('util')._extend;

var Scraper = {
  errorHandler : function(err){
    console.error("ERROR: " + err);
  },
  completedCallback : function(){
    console.log('✔' + this.options.publisher + " Scrape Completed!");
    updateScrapeStatus(false);
  },
  addComic : function(newComic){
    Comic.update({ title : newComic.title, publisher: newComic.publisher, issue: newComic.issue}, {$set: newComic}, {upsert:true}, function(err, comicsUpdated){
        if(err) this.errorHandler(err);
        console.log("Added "+newComic.title+" #"+newComic.issue +" by "+newComic.publisher);
    });
  },
  scrape : function(options, errCb){
    var errorCallback = errCb || Scraper.errorHandler;

    if(!options.publisher ||
       !options.URL||
       !options.monthFormat||
       !options.yearFormat||
       !options.dayFormat ||
       !options.scrapeFunction||
       !options.scrapeTime||
       !options.scrapeMinute){
      errorCallback("Missing required options");
      return;
    }
    
    console.log("Initialised "+options.publisher+" scraper. Hour="+options.scrapeTime+" Minute="+options.scrapeMinute);

    var scheduledTask = schedule.scheduleJob({hour: options.scrapeTime, minute: options.scrapeMinute, dayOfWeek: new schedule.Range(1, 5)}, function(){
      console.log("Beginning scrape of "+options.publisher);
      updateScrapeStatus(true);

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
              
              options.scrapeFunction({
                '$' : $,
                'addComic' : Scraper.addComic,
                'nextCallback' : nextCallback,
                'errorCallback' : errorCallback,
                'completedCallback' : Scraper.completedCallback,
                'now' : now,
              });
              
            }else if(response.statusCode === 404){
              console.log(URL+" not found, assuming end of scrape");
            }
        });
        
      };
    
      scrapeComics();
    
    });
  },
  start : function(opt){
    if(opts){
      this.options = extend(this.options, opts);
    }
    this.scrape(this.options);
  },
  startNow : function(){
    var opts = { 
      'scrapeTime' : parseInt(moment().format('H')),
      'scrapeMinute' : parseInt(moment().format('m'))+1
    };
    this.options = extend(this.options, opts);
    this.scrape(this.options);
  }
};

var updateScrapeStatus = function updateScrapeStatus(increment){
  var query = Settings.where({ name: 'scrapes' });
  query.findOne(function (err, settings) {
    if (err) return;
    var numOfScrapes = 0;
    if (settings) {
      numOfScrapes = settings.value;
    }else{
      settings = new Settings ({ name : 'scrapes', value : 0});
    }
    if(increment){
      numOfScrapes++;
    }else{
      numOfScrapes--;
    }

    settings.value = numOfScrapes;
    settings.save(function (err) {
      if(err) {
        console.error('Unable to save scrape status setting.');
      }
    });
  });
};

module.exports = Scraper;
