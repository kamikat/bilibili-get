var fs = require('mz/fs');
var tmp = require('tmp-promise');
var path = require('path');
var subprocess = require('child_process');
var debug = require('debug').debug('bilibili:i:merger');

var mergeSegmentFiles = function* (segmentFiles, outputPath, { dryRun }) {
  debug('merging segment files:\n    ' + segmentFiles.join('\n    '));

  var tmpFile = yield tmp.file();

  yield fs.write(tmpFile.fd, segmentFiles.map((a) => `file '${a}'`).join('\n'));

  var ffmpegOptions = [
      '-loglevel quiet',
      '-f concat',
      '-safe 0',
      `-i "${tmpFile.path}"`,
      '-c copy',
      `"${path.resolve(outputPath)}"`
    ]
    , mergeCommand = `ffmpeg ${ffmpegOptions.join(' ')}`;

  debug(`executing merge command:\n${mergeCommand}`);

  if (dryRun) {
    return;
  }

  var { status } = subprocess.spawnSync('ffmpeg', ffmpegOptions, { stdio: 'inherit', shell: true });

  if (status) {
    if (yield fs.exists(outputPath)) {
      debug('cleanup partial output.');
      yield fs.rm(outputPath);
    }
    throw new Error(`ffmpeg command failed with code ${status}.`);
  } else {
    debug('cleanup segment files...');
    yield segmentFiles.map((f) => fs.unlink(f));
    debug('merging segment files: success.');
  }
};

module.exports = { mergeSegmentFiles };
