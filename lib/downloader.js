var fs = require('mz/fs');
var path = require('path');
var debug = require('debug').debug('bilibili:i:downloader');
var check = require('debug').debug('bilibili:d:downloader');
var process = require('process');
var subprocess = require('child_process');
var _ = require('lodash');

var guessFileExtension = function (url) {
  return /https?:\/\/(?:[^/]+\/)+[^.]+(?:\.[^.]+\.)*\.?(.*)(?=\?)/.exec(url)[1];
};

var downloadFiles = function* (taskInfo, { dryRun, print = _.noop, outputDir, downloadOptions = [] }) {

  var segmentFiles = [];

  for (var i = 0, N = taskInfo.durl.length; i++ != N; segmentFiles[i-1] = yield (function* ({ url, size }) {

    print(`downloading video segment ${i}/${N}...`);

    var fileName = `av${taskInfo.aid}-${i}.${guessFileExtension(url)}`
      , filePath = path.resolve(outputDir, fileName);

    try {
      var stat = yield fs.stat(filePath);
      if (stat.size === size && !(yield fs.exists(`${filePath}.aria2`))) {
        debug(`file ${filePath} already downloaded.`);
        return filePath;
      } else {
        debug(`file ${filePath} is incomplete.`);
      }
    } catch (e) {
      debug(`file ${filePath} not exists.`);
    }

    var aria2cOptions = [
        '--no-conf',
        '--console-log-level=error',
        '--file-allocation=none',
        '--summary-interval=0',
        '--download-result=hide',
        '--continue',
        `--dir="${outputDir}"`,
        `--out="${fileName}"`,
        `--referer="${taskInfo.url}"`,
        ...downloadOptions.map((option) => (option.length === 1 || option.indexOf('=') === 1) ? `-${option}` : `--${option}`),
        `"${url}"`
      ]
      , downloadCommand = `aria2c ${aria2cOptions.join(' ')}`;

    debug(`executing download command:\n${downloadCommand}`);

    if (dryRun) {
      return filePath;
    }

    var { status } = subprocess.spawnSync('aria2c', aria2cOptions, { stdio: 'inherit', shell: true });

    process.stderr.write('\33[2K\r');

    if (status) {
      throw new Error(`download command failed with code ${status}.`);
    }

    return filePath;
  })(taskInfo.durl[i-1]));

  debug('download video segments: success.');
  check(segmentFiles);

  return segmentFiles;
};

module.exports = { downloadFiles, guessFileExtension };
