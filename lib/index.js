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

  var location = (function () {

    debug(`parsing url ${url}...`);
    var location = parseUrl(url);
    debug(`parsing url ${url}... done`);
    debug(location);

    return location;

  })();

  var taskList = yield (function* (taskList) {

    console.info('extracting video metadata...');

    debug('extracting metadata...');
    if (location.type === 1) {
      var videoInfo = yield findVideoInfo(location);
      videoInfo.parts.forEach((part) => {
        if (!location.part_id || location.part_id === part.part_id) {
          taskList.push({
            ...videoInfo.info,
            ...part
          });
        }
      });
    } else {
      var videoInfo = yield findBangumiInfo(location);
      videoInfo.parts.forEach((part) => {
        if (!location.episode_id || location.episode_id === part.episode_id) {
          taskList.push({
            ...videoInfo.info,
            ...part,
            season_type: videoInfo.season_type
          });
        }
      });
    }
    debug('extracting metadata... done');
    debug('creating task list... done');
    debug(taskList);

    return taskList;

  })([]);

  for (var i = 0, n = taskList.length; i != n; i++) {
    var display = function (str) {
      str.split('\n').forEach((line) => {
        console.info(`[${i+1}/${n}] ${line}`);
      });
    }

    yield (function* (taskInfo) {

      display(`start download av${taskInfo.aid} - ${taskInfo.title} #${taskInfo.index} ${taskInfo.index_title}...`);

      debug(`processing task [${i+1}/${n}]...`);
      debug(taskInfo);

      taskInfo = Object.assign(taskInfo, yield fetchPlayInfo({ ...taskInfo, quality, cookie }));

      if (!silent) {
        var printRow = rowSpec([ columnSpec(8), columnSpec(15), columnSpec() ]);
        display(`supported video quality:`);
        display(_.map(_.zip(taskInfo.accept_quality, taskInfo.accept_format.split(','), taskInfo.accept_description), (v) => '  '+(v[0]===taskInfo.quality?'*':' ')+' '+printRow(v)).join('\n'));
      }

      debug(`processing task [${i+1}/${n}]... done`);

    })(taskList.shift());
  }

};
