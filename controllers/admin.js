var mongoose = require('mongoose');
var User = require('../models/User').User;
var moment = require('moment');

exports.validateAdmin = function(req, res, next) {
    User.findOne({
        _id: req.query.api_key
    }, function(error, user) {
        if (!error && user && user.is_superhero) {
            next();
        } else {
            res.status(401);
        }
    });
};

exports.getMostActiveUser = function(req, res) {
	User.aggregate([
		{ $unwind : '$log' },
		{ $group : { 
			'_id' : {_id: '$_id', name: '$name', email: '$email'}, 'log' : { $push : '$log'} , 'count' : { '$sum' : 1 } 
		} },
		{ $sort : { 'count' : -1 } },
		{ $limit : 1 },
		{ $project : { 'name' : '$_id.name', 'email' : '$_id.email', count : 1, _id : 0 } }
		],
	    function(error, docs) {
	        return res.send(docs);
    });
};

exports.getTopUsers = function(req, res) {
	User.aggregate([
		{ $unwind : '$log' },
		{ $group : { 
			'_id' : {_id: '$_id', name: '$name', email: '$email'}, 'log' : { $push : '$log'} , 'count' : { '$sum' : 1 } 
		} },
		{ $sort : { 'count' : -1 } },
		{ $limit : parseInt(req.param('number')) },
		{ $project : { 'name' : '$_id.name', 'email' : '$_id.email', count : 1, _id : 0 } }
		],
	    function(error, docs) {
	    	if(error) console.log(error);
	        return res.send(docs);
    });
};