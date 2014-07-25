var Post = require('../models').Post;
var moment = require('moment');
moment.lang('zh-cn');

exports.index = function (req, res) {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //查询并返回第 page 页的 10 篇文章
    Post.getPage(null, page, function (err, posts, total) {
      if (err) {
        posts = [];
      } 
      posts.forEach(function (v) {
         v.dateFromNow = moment(v.created_at).startOf().fromNow();
      }); 
      res.render('index', {
        title: '首页',
        posts: posts,
        page: page,
        total: total,
        totalPage: Math.ceil(total / 10),
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  }
