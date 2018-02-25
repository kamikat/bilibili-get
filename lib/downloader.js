var debug = require('debug').debug('bilibili:downloader');

var downloadFiles = function* (taskInfo, { dryRun, outputPattern, print }) {
  taskInfo.ext = /https?:\/\/(?:[^/]+\/)+[^.]+(?:\.[^.]+\.)*\.?(.*)(?=\?)/.exec(taskInfo.durl[0].url)[1] || taskInfo.format;
  return [

  ]
};

module.exports = { downloadFiles };
