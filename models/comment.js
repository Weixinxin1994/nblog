var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var commentSchema = new mongoose.Schema({
  post_id: ObjectId,
  parent_id:ObjectId,
  author: {name:String,
           email: String,
           head: String},
  content:String,
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'comments' 
});

mongoose.model('Comment', commentSchema);