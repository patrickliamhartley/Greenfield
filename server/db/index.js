var mongoose = require('mongoose');
var mongoUri = 'mongodb://localhost/greenfield';

// Connect Mongoose to our local MongoDB via URI specified above and export it below
var db = mongoose.connect(mongoUri);

module.exports = db;
