var { parseUrl, findBangumiInfo, findVideoInfo, fetchPlayInfo } = require('./extractor');
var { columnSpec, rowSpec, compileOutputPattern } = require('./formatter');
var { downloadFiles } = require('./downloader');

var debug = require('debug').debug('bilibili:i:scheduler')
var check = require('debug').debug('bilibili:d:scheduler')
var _ = require('lodash');

module.exports = (url, { dryRun, listFormats, silent, quality, cookie, output }) => function* () {
  console.info('extracting video metadata...');

  debug('metadata extraction started.');

  var location = yield parseUrl(url);
  var taskList =
    location.type === 1 && (({info, parts}) =>
                            _(parts)
                            .filter(({ part_id }) => !location.part_id || part_id === location.part_id)
                            .map(v => ({ ...location, ...info, ...v }))
                            .value())(yield findVideoInfo(location))
                        || (({info, season_type, parts}) =>
                            _(parts)
                            .filter(({ episode_id }) => !location.episode_id || episode_id === location.episode_id)
                            .map(v => ({ ...location, ...info, ...v, season_type }))
                            .value())(yield findBangumiInfo(location))

  debug('task list constructed.')
  check(taskList);

  var outputPattern = compileOutputPattern(output);

  for (var i = 0, N = taskList.length; i++ != N; yield (function* (taskInfo) {

    var print = function (str) {
      str.split('\n').forEach((line) => {
        console.info(`[${i}/${N}] av${taskInfo.aid}: ${line}`);
      });
    }

    print(`start download "${taskInfo.title}${N>1?'('+taskInfo.index+')':''}${taskInfo.index_title?' ':''}${taskInfo.index_title||''}"...`);

    debug(`processing task [${i}/${N}]...`);
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

    if (!listFormats) {
      var fileInfo = yield downloadFiles(taskInfo, { print, dryRun, outputPattern });
    }

    debug(`processing task [${i}/${N}]... done`);

  })(taskList.shift()));
};
