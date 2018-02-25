var _ = require('lodash');
var playUrl = require('bilibili-playurl');
var debug = require('debug').debug('bilibili:main');
var axios = require('axios').create({
  headers: {
    common: {
      'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"
    }
  }
});

var { parseUrl, findBangumiInfo, findVideoInfo } = require('./meta');
var { columnSpec, rowSpec } = require('./util');

var fetchPlayInfo = function* ({ cid, quality, season_type, cookie }) {
  var url = yield playUrl(cid, { quality, season_type });
  debug(`requesting playurl ${url}...`)
  var { data } = yield axios.get(url, cookie ? {
    headers: { 'Cookie': cookie }
  } : {});
  debug(`requesting playurl... done`);
  debug(data);
  if (data.code) {
    throw new Error(`cannot get play info for Task#${i+1}`);
  }
  return data;
};

module.exports = (url, { silent, quality, cookie }) => function* () {

  debug(`parsing url ${url}...`);
  var location = yield parseUrl(url);
  debug(`parsing url ${url}... done`);
  debug(location);

  console.info('extracting video metadata...');

  debug('extracting metadata...');
  var taskList =
    location.type === 1 && (({info, parts}) =>
                            _(parts)
                            .filter(({ part_id }) => !location.part_id || part_id === location.part_id)
                            .map(v => ({ ...info, ...v }))
                            .value())(yield findVideoInfo(location))
                        || (({info, season_type, parts}) =>
                            _(parts)
                            .filter(({ episode_id }) => !location.episode_id || episode_id === location.episode_id)
                            .map(v => ({ ...info, ...v, season_type }))
                            .value())(yield findBangumiInfo(location))
  debug('extracting metadata... done');
  debug(taskList);

  for (var i = 0, n = taskList.length; i != n; i++) {
    yield (function* (taskInfo) {

      var print = function (str) {
        str.split('\n').forEach((line) => {
          console.info(`[${i+1}/${n}] av${taskInfo.aid}: ${line}`);
        });
      }

      print(`start download "${taskInfo.title} #${taskInfo.index}${(taskInfo.index_title&&' ')+taskInfo.index_title}"...`);

      debug(`processing task [${i+1}/${n}]...`);
      debug(taskInfo);

      taskInfo = Object.assign(taskInfo, yield fetchPlayInfo({ ...taskInfo, quality, cookie }));

      if (!silent) {
        var printRow = rowSpec([ columnSpec(8), columnSpec(15), columnSpec() ]);
        print(`video quality:`);
        print(
          _()
          .zip(taskInfo.accept_quality, taskInfo.accept_format.split(','), taskInfo.accept_description)
          .map((v) => '  ' + (v[0] === taskInfo.quality ? '*' : ' ') + ' ' + printRow(v))
          .value()
          .join('\n'));
      }

      debug(`processing task [${i+1}/${n}]... done`);

    })(taskList.shift());
  }
};
