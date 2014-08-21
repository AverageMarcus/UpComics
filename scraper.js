var request = require('request');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var mongoose = require('mongoose');
var Comic = require('./models/Comic').Comic;
var moment = require('moment');
var titleHelper = require('./TitleHelper');

var baseMarvelURL = 'http://marvel.com';
var baseImageURL = 'http://imagecomics.com';
var baseDCURL = 'http://www.dccomics.com';
var baseDarkHorseURL = 'http://www.darkhorse.com';

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
});

mongoose.connect('mongodb://localhost/UpComics');