var _ = require('lodash');
var Axios = require('axios');
var debug = require('debug').debug('bilibili:main');
var generatePlayUrl = require('bilibili-playurl');
var { parseUrl, findBangumiInfo, findVideoInfo } = require('./meta');
var { columnSpec, rowSpec } = require('./util');

module.exports = (url, { silent, quality, cookie }) => function* () {

  var axios = Axios.create({
    headers: {
      common: Object.assign({
        'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"
      }, cookie && {
        'Cookie': cookie
      })
    }
  })

  debug(`parsing url ${url}...`);
  var location = parseUrl(url);
  debug(`parsing url ${url}... done`);
  debug(location);

  console.info('extracting video metadata...');

  var taskList = [];

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

  for (var i = 0, n = taskList.length; i != n; i++) {
    var taskInfo = taskList.shift();

    var display = function (str) {
      str.split('\n').forEach((line) => {
        console.info(`[${i+1}/${n}] ${line}`);
      });
    }

    display(`start download av${taskInfo.aid} - ${taskInfo.title} #${taskInfo.index} ${taskInfo.index_title}...`);
    debug(taskInfo);

    debug(`fetching play info...`);
    var playUrl = yield generatePlayUrl(taskInfo.cid, {
      quality: parseInt(quality),
      season_type: taskInfo.season_type
    });
    var { data } = yield axios.get(playUrl);
    debug(`fetching play info... done`);
    debug(data);

    if (data.code !== 0) {
      throw new Error(`cannot get play info for Task#${i+1}`);
    }

    if (!silent) {
      var printRow = rowSpec([ columnSpec(8), columnSpec(15), columnSpec() ]);
      display(`supported video quality:`);
      display(_.map(_.zip(data.accept_quality, data.accept_format.split(','), data.accept_description), (v) => '  '+(v[0]===data.quality?'*':' ')+' '+printRow(v)).join('\n'));
    }

  }

};
