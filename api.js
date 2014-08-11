var mongoose = require('mongoose');
var Comic = require('./models/Comic').Comic;
var User = require('./models/User').User;
var moment = require('moment');

mongoose.connect('mongodb://localhost/UpComics');

exports.validateApiKey = function(req, res, next){
	if (req.path == '/' || req.path.indexOf('/firstrun') >= 0){
		next();
	}
	User.count({_id : req.query.api_key}, function(error, count){
		if(!error && count){
			next();
		}else{
			res.status(500).send('API Key Invalid');
		}
	});
};

exports.countByPublisher = function(req, res){
	Comic.count({publisher : new RegExp(req.param('publisher'), "i")}, { '_id': 0 }, function(error, count){
		if(error) console.error(error);
		res.send({ publisher: req.param('publisher'), count: count });
	});
};

exports.getComicsByDate = function(req, res){
	Comic.find({release_date : req.param('date') }, { '_id': 0 }, function(error, docs){
		if(error) console.error(error);
		res.send(docs);
	});
};

exports.getTodaysReleases = function(req, res){
	Comic.find({release_date : moment().format('YYYY-MM-DD') }, { '_id': 0 }, function(error, docs){
		if(error) console.error(error);
		res.send(docs);
	});
};

exports.getThisWeeksReleases = function(req, res){
	var firstOfWeek = moment().startOf('week');
	var thisWeek = [];
	thisWeek.push(moment(firstOfWeek));
	for(var i=1;i<7;i++){
		thisWeek.push(moment(firstOfWeek.add(1, 'd')));
	}
	Comic
		.find({}, { '_id': 0 })
		.or({release_date : thisWeek[0].format('YYYY-MM-DD') })
		.or({release_date : thisWeek[1].format('YYYY-MM-DD') })
		.or({release_date : thisWeek[2].format('YYYY-MM-DD') })
		.or({release_date : thisWeek[3].format('YYYY-MM-DD') })
		.or({release_date : thisWeek[4].format('YYYY-MM-DD') })
		.or({release_date : thisWeek[5].format('YYYY-MM-DD') })
		.or({release_date : thisWeek[6].format('YYYY-MM-DD') })
		.exec(function(error, docs){
			if(error) console.error(error);
			res.send(docs);
	});
};

exports.getBySeries = function(req, res){
	Comic.find({title : new RegExp(req.param('series'), "i") }, { '_id': 0 }, function(error, docs){
		if(error) console.error(error);
		res.send(docs);
	});
};