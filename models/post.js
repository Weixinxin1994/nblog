var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var postSchema = new mongoose.Schema({
      author: {name:String, head:String},
      title:String,
      tags: [String],
      content: String,      
      comments:[{
        _id:false,
        name: String,
        head: String,
        content: String,
        commented_at: String
        }],
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now },
      last_comment_at:{ type: Date, default: Date.now },
      pv: { type: Number, default: 0 }
}, {
  collection: 'posts' 
});

mongoose.model('Post', postSchema);
