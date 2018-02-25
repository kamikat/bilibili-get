var fs = require('mz/fs');
var path = require('path');
var debug = require('debug').debug('bilibili:i:downloader');
var check = require('debug').debug('bilibili:d:downloader');
var subprocess = require('child_process');
var _ = require('lodash');

var guessFileExtension = function (url) {
  return /https?:\/\/(?:[^/]+\/)+[^.]+(?:\.[^.]+\.)*\.?(.*)(?=\?)/.exec(url)[1];
}

var downloadFiles = function* (taskInfo, { dryRun, print = _.noop, outputPattern, outputFormat, downloadOptions = [] }) {

  debug(`download video segments...`);

  outputFormat = outputFormat ||
    (_(taskInfo.durl).map(({ url }) => guessFileExtension(url)).reduce((a, b) => a == b ? a : 'mkv'));

  print(`output format: ${outputFormat}`)

  var outputPath = outputPattern({
    aid: 0,
    cid: 0,
    title: '',
    index: '',
    index_title: '',
    quality: 0,
    format: '',
    ...taskInfo,
    ext: outputFormat
  });

  print(`output path: ${outputPath}`);

  var segmentFiles = []
    , fileInfo = { outputPath, segmentFiles };

  for (var i = 0, N = taskInfo.durl.length; i++ != N; segmentFiles[i-1] = yield (function* ({ order, url, size, backup_url }) {

    print(`downloading video segment ${i}/${N}...`);

    var filePath = path.resolve(path.dirname(outputPath), `av${taskInfo.aid}-${i}.${guessFileExtension(url)}`);

    try {
      var stat = yield fs.stat(filePath);
      if (stat.size === size && !(yield fs.exists(`${filePath}.aria2`))) {
        debug(`file ${filePath} already downloaded.`);
        return filePath;
      } else {
        debug(`file ${filePath} is incomplete.`)
      }
    } catch (e) {
      debug(`file ${filePath} not exists.`);
    }

    var aria2cOptions = [
      '--no-conf',
      '--console-log-level=error',
      '--file-allocation=none',
      '--summary-interval=0',
      '--continue',
      `--dir="${path.dirname(filePath)}"`,
      `--out="${path.basename(filePath)}"`,
      `--referer="${taskInfo.url}"`,
      ...downloadOptions
    ]
      , downloadCommand = `aria2c ${aria2cOptions.join(' ')} "${url}"`;

    debug(`executing download command:\n${downloadCommand}`);

    if (dryRun) {
      return filePath;
    }

    var { status } = subprocess.spawnSync('sh', ['-c', downloadCommand], {
      stdio: 'inherit'
    });

    if (status) {
      throw new Error(`download command failed with code ${status}.`);
    }

    return filePath;
  })(taskInfo.durl[i-1]))

  debug(`download video segments: success.`);
  check(fileInfo);

  return fileInfo;
};

module.exports = { downloadFiles };
