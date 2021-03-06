var Comic = require('../models/Comic').Comic;
var User = require('../models/User').User;
var Settings = require('../models/Settings').Settings;
var moment = require('moment');

exports.validateApiKey = function(req, res, next) {
    if (req.path == '/' || req.path.toLowerCase().indexOf('/firstrun') >= 0) {
        return next();
    }
    User.count({
        _id: req.query.api_key
    }, function(error, count) {
        if (!error && count) {
            next();
        } else {
            res.status(500).send('API Key Invalid');
        }
    });
};

exports.recordQueries = function(req, res, next) {
    var logRequest = function logRequest(error, user){
        var queries = {};
        var log = user.log || [];
        var param;
        for (param in req.query) { 
            queries[param] = req.query[param]; 
        }
        for (param in req.params) { 
            queries[param] = req.params[param]; 
        }
        delete queries['api_key'];

        log.push({
            path : req.path,
            query : queries,
            date : Date.now
        });
        User.update({ _id : user._id }, {$set : { 'log' : log } }, function(error){
            if (error) {
                console.error(error);
                return res.status(500).send('An unexpected error occured');
            }
            return next();
        });
    };

     User.findOne({
        _id: req.query.api_key
    }, logRequest);

};

exports.isScraping = function(req, res){
    var next = handleResponse(res);
    var query = Settings.where({ name: 'scrapes' });
      query.findOne(function (err, settings) {
        if (err) return next(err);
        var numOfScrapes = 0;
        if (settings) {
          numOfScrapes = settings.value;
        }
        // !! converts the integer to a boolean
        return next(err, !!numOfScrapes);
      });
};

exports.getPublishers = function(req, res){
    var next = handleResponse(res);
    Comic.distinct('publisher', function(error, publishers){
        return next(error, publishers);
    });
};

exports.getByPublisher = function(req, res) {
    var query = buildQuery()
                .setPublisher(new RegExp(req.param('publisher'), "i"))
                .getQuery();
    getComics(query, handleResponse(res));
};
exports.countByPublisher = function(req, res) {
    var query = buildQuery()
                .setPublisher(new RegExp(req.param('publisher'), "i"))
                .getQuery();
    getComicsCount(query, handleResponse(res));
};

exports.getComicsByDate = function(req, res) {
    var release_date = moment(req.param('date'));
    var query = buildQuery()
                .setReleaseDate(release_date.format('YYYY-MM-DD'))
                .getQuery();
    getComics(query, handleResponse(res));
};
exports.countComicsByDate = function(req, res) {
    var release_date = moment(req.param('date'));
    var query = buildQuery()
                .setReleaseDate(release_date.format('YYYY-MM-DD'))
                .getQuery();
    getComicsCount(query, handleResponse(res));
};

exports.getTodaysReleases = function(req, res) {
    var query = buildQuery()
                .setReleaseDate(moment().format('YYYY-MM-DD'))
                .getQuery();
    getComics(query, handleResponse(res));
};
exports.countTodaysReleases = function(req, res) {
    var query = buildQuery()
                .setReleaseDate(moment().format('YYYY-MM-DD'))
                .getQuery();
    getComicsCount(query, handleResponse(res));
};

exports.getThisWeeksReleases = function(req, res) {
    var firstOfWeek = moment().startOf('week');
    var query = buildQuery()
                .setReleaseDate({
                    $gte: firstOfWeek.format('YYYY-MM-DD'),
                    $lte: moment(firstOfWeek.add(7, 'd')).format('YYYY-MM-DD')
                })
                .getQuery();
    getComics(query, handleResponse(res));
};
exports.countThisWeeksReleases = function(req, res) {
    var firstOfWeek = moment().startOf('week');
    var query = buildQuery()
                .setReleaseDate({
                    $gte: firstOfWeek.format('YYYY-MM-DD'),
                    $lte: moment(firstOfWeek.add(7, 'd')).format('YYYY-MM-DD')
                })
                .getQuery();
    getComicsCount(query, handleResponse(res));
};

exports.getBySeries = function(req, res) {
    var query = buildQuery()
                .setTitle(new RegExp(req.param('series'), "i"))
                .getQuery();
    getComics(query, handleResponse(res));
};
exports.countBySeries = function(req, res) {
    var query = buildQuery()
                .setTitle(new RegExp(req.param('series'), "i"))
                .getQuery();
    getComicsCount(query, handleResponse(res));
};

exports.advancedSearch = function(req, res) {
    var release_date = { $gte : moment().format("YYYY-MM-DD") };
    if (req.param('release_date')) {
        release_date = moment(req.param('release_date')).format('YYYY-MM-DD');
    } else if (req.param('release_date_start') && req.param('release_date_end')) {
        if (moment(req.param('release_date_end')).isBefore(moment(req.param('release_date_start')))) {
            return res.status(500).send('End date cannot be before start date');
        }
        release_date = {
            $gte: moment(req.param('release_date_start')).format('YYYY-MM-DD'),
            $lte: moment(req.param('release_date_end')).format('YYYY-MM-DD')
        };
    } else if (req.param('release_date_start')) {
        release_date = {
            $gte: moment(req.param('release_date_start')).format('YYYY-MM-DD')
        };
    } else if (req.param('release_date_end')) {
        release_date = {
            $gte: moment().format("YYYY-MM-DD"),
            $lte: moment(req.param('release_date_end')).format('YYYY-MM-DD')
        };
    }
    var query = buildQuery()
                .setTitle(new RegExp(req.param('series'), "i"))
                .setPublisher(new RegExp(req.param('publisher'), "i"))
                .setIssue(req.param('issue'))
                .setReleaseDate(release_date)
                .getQuery();
    if(req.param('count') == 1){
        getComicsCount(query, handleResponse(res));
    }else{
        getComics(query, handleResponse(res));
    }
};

function buildQuery() {
    return (function() {
        var query = {
            title: '',
            issue: '',
            release_date: {
                $gte: moment().format("YYYY-MM-DD")
            },
            publisher: ''
        };

        function setTitle(title) {
            query.title = title;
            return this;
        }

        function setIssue(issue) {
            query.issue = issue;
            return this;
        }

        function setReleaseDate(release_date) {
            query.release_date = release_date;
            return this;
        }

        function setPublisher(publisher) {
            query.publisher = publisher;
            return this;
        }

        function getQuery() {
            for (var i in query) {
                if (query[i] === null || query[i] === undefined || query[i] === '' || query[i] === {}) {
                    delete query[i];
                }
            }
            return query;
        }
        return {
            setTitle: setTitle,
            setIssue: setIssue,
            setReleaseDate: setReleaseDate,
            setPublisher: setPublisher,
            getQuery: getQuery
        };
    }());
}

function getComics(query, next) {
    Comic.find(query, {
        '_id': 0
    }, function(error, docs) {
        return next(error, docs);
    });
}

function getComicsCount(query, next) {
    Comic.count(query, function(error, count) {
        return next(error, ''+count); // Force string
    });
}

function handleResponse(res) {
    return function(error, docs) {
        if (error) {
            console.error(error);
            return res.status(500).send('An unexpected error occured');
        }
        return res.send(docs);
    };
}
