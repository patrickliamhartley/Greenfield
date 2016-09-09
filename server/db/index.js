var mongoose = require('mongoose');
var mongoUri = 'mongodb://heroku_p5trc288:hjv2q2f5kvp5drpdc3p7ccu9hi@ds029106.mlab.com:29106/heroku_p5trc288';

// Connect Mongoose to our local MongoDB via URI specified above and export it below
var db = mongoose.connect(mongoUri);

module.exports = db;
