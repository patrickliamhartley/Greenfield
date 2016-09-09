var mongoose = require('mongoose');
var mongoUri = 'mongodb://patrickliamhartley:muFFin1.@ds021016.mlab.com:21016/greenfield';

// Connect Mongoose to our local MongoDB via URI specified above and export it below
var db = mongoose.connect(mongoUri);

module.exports = db;
