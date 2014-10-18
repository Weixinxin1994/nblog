var models = require('../models');
var Comment = models.Comment;;
var moment = require('moment');
moment.locale('zh-cn');
var Post = models.Post;

exports.comment = function (req, res) {
    var commented_at = new Date();
    var commented_at_str = moment(commented_at).format("YYYY-MM-DD HH:mm:ss");
    var user = req.session.user;
    var comment = new Comment({
        post_id:req.params._id,
        author:{
          name: user.name,
          head: user.head
          },
        content: req.body.content
    });
    comment.save(function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      Post.update({_id:req.params._id},{$inc: {"comment_count": 1}}, function (err) {
          if (err) {
           req.flash('error', err); 
           return res.redirect('back');
          }
        });
      req.flash('success', '评论成功!');
      res.redirect('back');
    });
  }