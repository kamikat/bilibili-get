var { plan, pass } = require('tap');

var co = require('co');
var main = require('./lib');

var options = {
  dryRun: true,
  silent: true,
  output: 'av%(aid)s %(title)s%(#index&&"\\(")s%(index)s%(#index&&"\\)")s%(#index_title&&" ")s%(index_title)s.%(ext)s'
};

co(function* () {

  plan(12);

  yield main('https://www.bilibili.com/video/av106', options);
  pass('get user-uploaded video');

  yield main('https://www.bilibili.com/video/av8042104/', options);
  pass('get user-uploaded video (multipart)');

  yield main('https://www.bilibili.com/video/av8042104/index_1.html', options);
  pass('get user-uploaded video (multipart) p2');

  yield main('https://www.bilibili.com/video/av25432066/?p=39', options);
  pass('get user-uploaded video (multipart) p3');

  yield main('https://www.bilibili.com/bangumi/play/ss12364/', options);
  pass('get movie bangumi');

  yield main('https://bangumi.bilibili.com/anime/3418', options);
  pass('get tv bangumi (A)');

  yield main('https://bangumi.bilibili.com/anime/3418/play#84970', options);
  pass('get tv bangumi eposide (A)');

  yield main('https://www.bilibili.com/bangumi/play/ss3418', options);
  pass('get tv bangumi (B)');

  yield main('https://www.bilibili.com/bangumi/play/ep84969', options);
  pass('get tv bangumi episode (B1)');

  yield main('https://www.bilibili.com/bangumi/play/ss3418#84970', options);
  pass('get tv bangumi episode (B2)');

  yield main('http://acg.tv/av106', options);
  pass('get link redirects to bilibili');

  try {
    yield main('http://acg.tv/av1267', options);
  } catch(e) {
    pass('display error message');
  }

});

