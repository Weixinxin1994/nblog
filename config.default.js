var config = {
  cookieSecret: 'nblog', 
  db: 'nblog', 
  host: 'localhost',
  port:8890,
  url:'mongodb://localhost/nblog',
  name:"站点名称",
    // 版块
  tabs: [
    ['essay', '随笔'],
    ['review', '点评'],
    ['travel','旅行'],
    ['others', '其他']
  ],
};

module.exports = config;
module.exports.config = config;
