var express=require('express');
var router=express.Router();//从express中取出router对象
var post = require('../controllers/post');
var comment = require('../controllers/comment');
var home = require('../controllers/home');
var sign = require('../controllers/sign');
var auth = require('../middlewares/auth');

router.get('/', home.index);
router.get('/list', auth.userRequired, home.list);

router.get('/signup', sign.showSignup);  // 跳转到注册页面
router.post('/signup', sign.signup);  // 提交注册信息

router.get('/signout', sign.signout);  // 登出
router.get('/signin', sign.showLogin);  // 进入登录页面
router.post('/signin', sign.login);  // 登录校验
router.get('/active_account', sign.active_account);  //帐号激活

router.get('/search_pass', sign.showSearchPass);  // 找回密码页面
router.post('/search_pass', sign.updateSearchPass);  // 更新密码
router.get('/reset_pass', sign.reset_pass);  // 进入重置密码页面
router.post('/reset_pass', sign.update_pass);  // 更新密码

router.get('/post', auth.userRequired, post.showPost);

router.post('/post', auth.userRequired, post.post);

router.get('/archive', auth.userRequired, post.archive);

router.get('/search', post.search);

router.get('/u/:name', post.getUserPage);

router.get('/p/:_id', post.getPost);

router.post('/p/:_id', comment.comment);

router.get('/edit/:_id', auth.userRequired, post.showEdit);

router.post('/edit/:_id', auth.userRequired, post.edit);

router.get('/remove/:_id', auth.userRequired, post.remove);

router.use(function (req, res) {
    res.render("404");
});
  
module.exports = router;
