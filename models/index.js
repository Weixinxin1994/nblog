var mongoose = require('mongoose');
var config = require('../config');

mongoose.connect(config.url, function(err) {
	if (err) {
		console.error("Connect to %s error: ", config.url, err.message);
		process.exit(1);
	}
});

db = mongoose.connection;
db.on('error', function(err) {
	db.close();
});
db.on('close', function() {
	mongoose.connect(config.url);
});

//models
require('./user');
require('./post');
require('./comment');

exports.User = mongoose.model('User');
exports.Post = mongoose.model('Post');
exports.Comment = mongoose.model('Comment');
