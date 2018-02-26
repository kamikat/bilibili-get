var { plan, pass } = require('tap');

var co = require('co');
var main = require('./lib');

var options = {
  dryRun: true,
  silent: true,
  output: 'av%(aid)s %(title)s%(#index&&"\\(")s%(index)s%(#index&&"\\)")s%(#index_title&&" ")s%(index_title)s.%(ext)s'
};

co(function* () {

  plan(9);

  yield main('https://www.bilibili.com/video/av106', options);
  pass('get user-uploaded video');

  yield main('https://www.bilibili.com/video/av4387689', options);
  pass('get user-uploaded video (multipart)');

  yield main('https://www.bilibili.com/video/av4387689/index_2.html', options);
  pass('get user-uploaded video (multipart) p2');

  yield main('https://www.bilibili.com/bangumi/play/ss12364/', options);
  pass('get movie bangumi');

  yield main('https://bangumi.bilibili.com/anime/1656', options);
  pass('get tv bangumi (A)');

  yield main('https://bangumi.bilibili.com/anime/1656/play#29993', options);
  pass('get tv bangumi eposide (A)');

  yield main('https://www.bilibili.com/bangumi/play/ss21720', options);
  pass('get tv bangumi (B)');

  yield main('https://www.bilibili.com/bangumi/play/ep183823', options);
  pass('get tv bangumi episode (B)');

  yield main('http://acg.tv/av106', options);
  pass('get link redirects to bilibili');

});

