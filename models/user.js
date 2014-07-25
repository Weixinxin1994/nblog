var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new mongoose.Schema({
  name: String,
  password: String,
  email: String,
  head: String,
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'users' 
});

mongoose.model('User', userSchema);