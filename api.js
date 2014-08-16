var mongoose = require('mongoose');
var Comic = require('./models/Comic').Comic;
var User = require('./models/User').User;
var moment = require('moment');
mongoose.connect('mongodb://localhost/UpComics');
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
exports.getByPublisher = function(req, res) {
    var query = buildQuery().setPublisher(new RegExp(req.param('publisher'), "i")).getQuery();
    getComics(query, handleResponse(res));
};
exports.countByPublisher = function(req, res) {
    var query = buildQuery().setPublisher(new RegExp(req.param('publisher'), "i")).getQuery();
    getComicsCount(query, handleResponse(res));
};
exports.getComicsByDate = function(req, res) {
    var release_date = moment(req.param('date'));
    var query = buildQuery().setReleaseDate(release_date.format('YYYY-MM-DD')).getQuery();
    getComics(query, handleResponse(res));
};
exports.countComicsByDate = function(req, res) {
    var release_date = moment(req.param('date'));
    var query = buildQuery().setReleaseDate(release_date.format('YYYY-MM-DD')).getQuery();
    getComicsCount(query, handleResponse(res));
};
exports.getTodaysReleases = function(req, res) {
    var query = buildQuery().setReleaseDate(moment().format('YYYY-MM-DD')).getQuery();
    getComics(query, handleResponse(res));
};
exports.countTodaysReleases = function(req, res) {
    var query = buildQuery().setReleaseDate(moment().format('YYYY-MM-DD')).getQuery();
    getComicsCount(query, handleResponse(res));
};
exports.getThisWeeksReleases = function(req, res) {
    var firstOfWeek = moment().startOf('week');
    var query = buildQuery().setReleaseDate({
        $gte: firstOfWeek.format('YYYY-MM-DD'),
        $lte: moment(firstOfWeek.add(7, 'd')).format('YYYY-MM-DD')
    }).getQuery();
    getComics(query, handleResponse(res));
};
exports.countThisWeeksReleases = function(req, res) {
    var firstOfWeek = moment().startOf('week');
    var query = buildQuery().setReleaseDate({
        $gte: firstOfWeek.format('YYYY-MM-DD'),
        $lte: moment(firstOfWeek.add(7, 'd')).format('YYYY-MM-DD')
    }).getQuery();
    getComicsCount(query, handleResponse(res));
};
exports.getBySeries = function(req, res) {
    var query = buildQuery().setTitle(new RegExp(req.param('series'), "i")).getQuery();
    getComics(query, handleResponse(res));
};
exports.countBySeries = function(req, res) {
    var query = buildQuery().setTitle(new RegExp(req.param('series'), "i")).getQuery();
    getComicsCount(query, handleResponse(res));
};
exports.advancedSearch = function(req, res) {
    var release_date = moment().format("YYYY-MM-DD");
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
    var query = buildQuery().setTitle(new RegExp(req.param('series'), "i")).setPublisher(new RegExp(req.param('publisher'), "i")).setIssue(req.param('issue')).setReleaseDate(release_date).getQuery();
    getComics(query, handleResponse(res));
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
    Comic.count(query, {
        '_id': 0
    }, function(error, count) {
        query['count'] = count;
        return next(error, query);
    });
}

function handleResponse(res) {
    var res = res;
    return function(error, docs) {
        if (error) {
            console.log(error);
            return res.status(500).send('An unexpected error occured');
        }
        return res.send(docs);
    };
}