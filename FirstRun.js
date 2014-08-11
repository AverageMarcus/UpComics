var mongoose = require('mongoose');
var User = require('./models/User').User;

exports.checkFirstRun = function(req, res, next){
	User.count({}, function(error, count){
		if(error){
			res.status(500).send(error);
		}else{
			if(count){
				next(req, res);
			}else{
				res.redirect('/firstrun');
			}
		}
	});
};

exports.index = function(req, res, next){
	res.render('FirstRun');
};

exports.submit = function(req, res, next){
	//TODO: Create admin user and display API key
};