var mongoose = require('mongoose');
var User = require('./models/User').User;

var getFirstRun = function getFirstRun(next){
	User.count({}, function(error, count){
		if(count){
			return next(false);
		}
		return next(true);
	});
};

exports.checkFirstRun = function(req, res, next){
	getFirstRun(function(isFirstRun){
		if(isFirstRun){
			res.redirect('/firstrun');
		}else{
			return next(req, res);
		}
	});
};

exports.index = function(req, res, next){
	getFirstRun(function(isFirstRun){
		if(isFirstRun){
			res.render('FirstRun');
		}else{
			res.redirect('/');
		}
	});
};

exports.submit = function(req, res, next){
	getFirstRun(function(isFirstRun){
		if(isFirstRun){
			var name = req.param('name');
			var email = req.param('email');
			
			var superhero = {
				name: name,
				email: email,
				is_superhero: true
			};
			User.create(superhero, function(error, doc){
				if(error){
					res.status(500).send(error);
				}else{
					res.render('AccountCreated', {user: doc});
				}
			});
		}else{
			res.status(500).send('Account already created');
		}
	});	
};