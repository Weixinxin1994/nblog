var crypto = require('crypto');
var models = require('../models');
var Post = models.Post;
var User = models.User;
var Comment = models.Comment;;
var moment = require('moment');
moment.lang('zh-cn');
var marked = require('marked');
var util = require('../tools/util');

//获取一篇文章
Post.getOne = function(_id, callback) {
      //根据用户名、发表日期及文章名进行查询
      Post.findByIdAndUpdate(_id, {$inc: {"pv": 1}}, function (err, doc) {
        if (err) {
          return callback(err);
        }
        if (doc) {
          //解析 markdown 
           doc.content= util.xss(marked(doc.content));
           doc.title = util.xss(doc.title);
           doc.comments.forEach(function (comment) {
            comment.content = util.xss(marked(comment.content));
          });
          callback(null, doc);//返回查询的一篇文章
        }
      });
};
 // 分页读取 
Post.getPage = function(name, page, callback) {
      var query = {};
      if (name) {
        query = {"author.name":name};
      }
      //使用 count 返回特定查询的文档数 total
      Post.count(query, function (err, total) {
        //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
        Post.find(query, null,{
          skip: (page - 1)*10,
          limit: 10,
          sort:{last_comment_at: -1}
          },function (err, docs) {
          if (err) {
            return callback(err);
          }
          //解析 markdown 为 html
          docs.forEach(function (doc) {
            doc.content = util.xss(marked(doc.content));
          });  
          callback(null, docs, total);
        });
      });
};

//返回原始发表的内容（markdown 格式）
Post.edit = function(_id, callback) {
      //根据用户名、发表日期及文章名进行查询
      Post.findById(_id, function (err, doc) {
        if (err) {
          return callback(err);
        }
        callback(null, doc);//返回查询的一篇文章（markdown 格式）
      });
};

//更新一篇文章及其相关信息
Post.update = function(_id, title, content, tags, callback) {
  var date = new Date();
      //更新文章内容
      Post.findByIdAndUpdate(_id, {
        $set: {title:title, content:content, tags:tags, updated_at:date}
      }, function (err) {
        if (err) {
          return callback(err);
        }
        callback(null);
      });
};

//删除一篇文章
Post.remove = function(_id, callback) {
        Post.findByIdAndRemove(_id, {
          w: 1
        }, function (err) {
          if (err) {
            return callback(err);
          }
         callback(null);
        });
};

//返回所有文章存档信息
Post.getArchive = function(callback) {
      //返回只包含 name、time、title 属性的文档组成的存档数组
      Post.find({}, {
        "author.name": 1,
        "created_at":1,
        "title": 1
      }, {sort: {_id:-1}}, function (err, docs) {
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
};

//返回所有标签
Post.getTags = function(callback) {
      //distinct 用来找出给定键的所有不同值
      Post.distinct("tags", function (err, docs) {
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
};


//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
      //查询所有 tags 数组内包含 tag 的文档
      Post.find({
        "tags": tag
      },{'author.name':1, created_at:1, title:1}, // Columns to Return
      {sort: {_id:-1}}
      , function (err, docs) {
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
};

//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
      var pattern = new RegExp("^.*" + keyword + ".*$", "i");
      Post.find({
        "title": pattern
      }, {
        "author.name": 1,
        "created_at":-1,
        "title": 1
      },{sort:{
        _id:-1
      }}, function (err, docs) {
        if (err) {
         return callback(err);
        }
        callback(null, docs);
      });
};


Post.postComment = function(_id, comment, last_comment_at, callback) {
      Post.findByIdAndUpdate(_id, {
        $set: {last_comment_at:last_comment_at},
        $push: {"comments": comment}
      } , function (err) {
          if (err) {
            return callback(err);
          }
          callback(null);
      }); 
};
      
exports.showPost = function (req, res) {
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  }
 
exports.post = function (req, res) {
    var title = req.body.title;
    var content = req.body.content;
    var currentUser = req.session.user,
        author = {name:currentUser.name, head:currentUser.head},
        tagstr = req.body.tag,
        tags = tagstr.split(";");
    var title_error =
      title === '' ?
      '标题不能是空的。' :
      (title.length >= 4 && title.length <= 100 ? '' : '标题字数太多或太少。');
    if (title_error) {
     req.flash('error', '标题字数太多或太少'); 
     res.render('post', {
        title: title,
        user: req.session.user,
        content:content,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
      return;
    } 
    
    if( tagstr.length== 0 ) {
    	  req.flash('error', '请填写标签'); 
     res.render('post', {
        title: title,
        user: req.session.user,
        content:content,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
      return;
    }
  
    var post = new Post({
      author:author, 
      title:title, 
      tags:tags, 
      content:content
      });
    post.save(function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      req.flash('success', '发布成功!');
      res.redirect('/');//发表成功跳转到主页
    });
   
  }
  
exports.archive = function (req, res) {
    Post.getArchive(function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      
      var k, refactor, v;
      refactor = [];
        posts.forEach(function (v) {
        var temp, _ref;
          v.smallDate = moment(v.created_at).format('YYYY MMMM');
          v.date = moment(v.created_at).format("YYYY-MM-DD HH:mm:ss");
          temp = (_ref = refactor[v.smallDate]) != null ? _ref : refactor[v.smallDate] = [];
          temp.push(v);
        });

        posts = [];
        for (k in refactor) {
          v = refactor[k];
          posts.push({
            date: k,
            list: v
          });
         }  
      res.render('archive', {
        title: '存档',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  } 
   
exports.showTags = function (req, res) {
    Post.getTags(function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('tags', {
        title: '标签',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  }
    
exports.tag = function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
      if (err) {
        req.flash('error',err); 
        return res.redirect('/');
      }
      var k, refactor, v;
      refactor = [];
        posts.forEach(function (v) {
        var temp, _ref;
          v.smallDate = moment(v.created_at).format('YYYY MMMM');
          v.date = moment(v.created_at).format("YYYY-MM-DD HH:mm:ss");
          temp = (_ref = refactor[v.smallDate]) != null ? _ref : refactor[v.smallDate] = [];
          temp.push(v);
        });

        posts = [];
        for (k in refactor) {
          v = refactor[k];
          posts.push({
            date: k,
            list: v
          });
         }
      res.render('archive', {
        title: 'TAG:' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  }
    
exports.search = function (req, res) {
    Post.search(req.query.keyword, function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      var k, refactor, v;
      refactor = [];
        posts.forEach(function (v) {
        var temp, _ref;
          v.smallDate = moment(v.created_at).format('YYYY MMMM');
          v.date = moment(v.created_at).format("YYYY-MM-DD HH:mm:ss");
          temp = (_ref = refactor[v.smallDate]) != null ? _ref : refactor[v.smallDate] = [];
          temp.push(v);
        });

        posts = [];
        for (k in refactor) {
          v = refactor[k];
          posts.push({
            date: k,
            list: v
          });
         }
      res.render('archive', {
        title: "SEARCH:" + req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  }
  
exports.getPage = function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //检查用户是否存在
    User.get(req.params.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!'); 
        return res.redirect('/');
      }
      //查询并返回该用户第 page 页的 10 篇文章
      Post.getPage(user.name, page, function (err, posts, total) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('/');
        }
        posts.forEach(function (v) {
         v.datetime = moment(v.created_at).format("YYYY-MM-DD HH:mm:ss");
        });
        res.render('user', {
          title: user.name,
          posts: posts,
          page: page,
          totalPage: Math.ceil(total / 10),
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    }); 
  }
  
exports.getUserPage = function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //检查用户是否存在
    User.get(req.params.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!'); 
        return res.redirect('/');
      }
      //查询并返回该用户第 page 页的 10 篇文章
      Post.getPage(user.name, page, function (err, posts, total) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('/');
        }
        posts.forEach(function (v) {
         v.datetime = moment(v.created_at).format("YYYY-MM-DD HH:mm:ss");
        });
        res.render('user', {
          title: user.name,
          posts: posts,
          page: page,
          totalPage: Math.ceil(total / 10),
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    }); 
  }  
  
 exports.getPost = function (req, res) {
    var post_id= req.params._id;
    if (post_id.length !== 24) {
    res.render('notify', {
      user: req.session.user,
      success: req.flash('success').toString(),
      error: '此话题不存在或已被删除'
     });
    
    return;
    }
    Post.getOne(req.params._id, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      if (!post) {
      res.render('notify', {
        user: req.session.user,
        success: req.flash('success').toString(),
        error: '此话题不存在或已被删除。'});
      return;
    }
      post.dateFromNow = moment(post.created_at).startOf().fromNow();
      post.datetime = moment(post.created_at).format("YYYY-MM-DD HH:mm:ss");
      res.render('article', {
        title: post.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  }
  
exports.comment = function (req, res) {
    var commented_at = new Date();
    var commented_at_str = moment(commented_at).format("YYYY-MM-DD HH:mm:ss");
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 
    var comment = {
        name: req.body.name,
        head: head,
        email: req.body.email,
        website: req.body.website,
        commented_at: commented_at_str,
        content: req.body.content
    };
    
    Post.postComment(req.params._id, comment, commented_at, function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', '评论成功!');
      res.redirect('back');
    });
  }
 
exports.showEdit = function (req, res) {
    Post.edit(req.params._id, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      res.render('edit', {
        title: '编辑',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  }
   
exports.edit = function (req, res) {
    var currentUser = req.session.user,
        title = req.body.title,
        content = req.body.content,
        tagstr = req.body.tag,
        tags = tagstr.split(";");
     var edit_error =
    title === '' ?
    '标题不能是空的。' :
    (title.length >= 4 && title.length <= 100 ? '' : '标题字数太多或太少。');
    if (edit_error) {
     req.flash('error', '标题字数太多或太少'); 
     res.render('post', {
        title: title,
        user: req.session.user,
        content:content,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    } else { 
    Post.update(req.params._id, title, content, tags, function (err) {
      var url = '/p/' + req.params._id;
      if (err) {
        req.flash('error', err); 
        return res.redirect(url);//出错！返回文章页
      }
      req.flash('success', '修改成功!');
      res.redirect(url);//成功！返回文章页
    });
   }
  }  
  
exports.remove = function (req, res) {
    Post.remove(req.params._id, function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', '删除成功!');
      res.redirect('/');
    });
  }   
