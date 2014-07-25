var express=require('express');
var router=express.Router();//从express中取出router对象
var user = require('../controllers/user');
var post = require('../controllers/post');
var home = require('../controllers/home');

router.get('/', home.index);

router.get('/reg', user.checkNotLogin);
router.get('/reg', user.showReg);

router.post('/reg', user.checkNotLogin);
router.post('/reg', user.reg);

router.get('/login', user.checkNotLogin);
router.get('/login', user.showLogin);

router.post('/login', user.checkNotLogin);
router.post('/login', user.login);

router.get('/post', user.checkLogin);
router.get('/post', post.showPost);

router.post('/post', user.checkLogin);
router.post('/post', post.post);

router.get('/logout', user.checkLogin);
router.get('/logout', user.logout);

router.get('/archive', post.archive);

router.get('/tags', post.showTags);

router.get('/tags/:tag', post.tag);

router.get('/search', post.search);

router.get('/u/:name', post.getUserPage);

router.get('/p/:_id', post.getPost);

router.post('/p/:_id', post.comment);

router.get('/edit/:_id', user.checkLogin);
router.get('/edit/:_id', post.showEdit);

router.post('/edit/:_id', user.checkLogin);
router.post('/edit/:_id', post.edit);

router.get('/remove/:_id', user.checkLogin);
router.get('/remove/:_id', post.remove);

router.use(function (req, res) {
    res.render("404");
});
  
module.exports = router;
