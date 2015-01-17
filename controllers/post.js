var crypto = require('crypto');
var models = require('../models');
var Post = models.Post;
var User = models.User;
var Comment = models.Comment;;
var moment = require('moment');
moment.locale('zh-cn');
var marked = require('marked');
var validator = require('validator');
var config= require('../config');

//获取一篇文章
Post.getOne = function(_id, callback) {
      //根据用户名、发表日期及文章名进行查询
      Post.findByIdAndUpdate(_id, {$inc: {"pv": 1}}, function (err, doc) {
        if (err) {
          return callback(err);
        }
        if (doc) {
          //解析 markdown 
           doc.content= validator.trim(marked(doc.content));
           doc.title = validator.trim(doc.title);
          Comment.find({post_id: _id}, null, {sort: {'created_at':"1"}}, function(err, comments) {
          if (err) {
            log.error('get comment failed with articleId ' + article_id);
            return;
         }
          comments.forEach(function (comment) {
            comment.content = validator.trim(marked(comment.content));
            comment.created_at_str = moment(comment.created_at).format("YYYY-MM-DD HH:mm:ss");
          });
         
          doc.comments = comments;
          callback(null, doc);//返回查询的一篇文章
        });
         // callback(null, doc);//返回查询的一篇文章
        }
      });
};
 // 分页读取 
Post.getPage = function(name, tab, page, callback) {
      var query = {};
      if (name) {
        query = {"author.name":name};
      }
      if (tab && tab !== 'all') {
        query.tab = tab;
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
            doc.content = validator.trim(marked(doc.content.substr(0,140)+"..."));
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
Post.updatePost = function(_id, title, tab, content, callback) {
  var date = new Date();
      //更新文章内容
      Post.findByIdAndUpdate(_id, {
        $set: {title:title, tab:tab, content:content, updated_at:date}
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
          //删除评论
         Comment.remove({post_id:_id}, function (err) {
           if (err) {
            return callback(err);
           }
          });
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
      tabs:config.tabs,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  }
// 得到所有的 tab, e.g. 
var allTabs = config.tabs.map(function (tPair) {
  return tPair[0];
});
 
exports.post = function (req, res) {
    var title = req.body.title;
    var tab = req.body.tab;
    var content = req.body.content;
    var currentUser = req.session.user,
        author = {name:currentUser.name, head:currentUser.head};

    // 验证
    var editError;
    if (title === '') {
      editError = '标题不能是空的。';
    } else if (title.length < 2 || title.length > 100) {
      editError = '标题字数太多或太少。';
    } else if (!tab || allTabs.indexOf(tab) === -1) {
      editError = '必须选择一个版块。';
    } else if (content === '') {
      editError = '内容不可为空';
    }
  // END 验证 
    if (editError) {
     req.flash('error', editError); 
     res.render('post', {
        title: title,
        tabs: config.tabs,
        tab:tab,
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
      tab:tab, 
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
      Post.getPage(user.name, null, page, function (err, posts, total) {
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
      Post.getPage(user.name, null, page, function (err, posts, total) {
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
    var user = req.session.user;
    var comment = {
        name: user.name,
        head: user.head,
        content: req.body.content,
        commented_at: commented_at_str
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
        tabs: config.tabs,
        tab:post.tab,
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
        tab = req.body.tab,
        content = req.body.content;
        // 验证
    var editError;
    if (title === '') {
      editError = '标题不能是空的。';
    } else if (title.length < 2 || title.length > 100) {
      editError = '标题字数太多或太少。';
    } else if (!tab || allTabs.indexOf(tab) === -1) {
      editError = '必须选择一个版块。';
    } else if (content === '') {
      editError = '内容不可为空';
    }
  // END 验证 
    if (editError) {
     req.flash('error', editError); 
     res.render('post', {
        title: title,
        tab:tab,
        user: req.session.user,
        content:content,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    } else { 
    Post.updatePost(req.params._id, title, tab, content, function (err) {
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
