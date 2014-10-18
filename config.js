module.exports = config;
module.exports.config = config;
var config = {
  cookieSecret: 'wozhi', 
  db: 'wozhi', 
  host: 'localhost',
  port:8890,
  url:'mongodb://localhost/wozhi',
      // 版块
  tabs: [
    ['essay', '随笔'],
    ['review', '点评'],
    ['others', '其他']
  ],
};

module.exports = config;
module.exports.config = config;