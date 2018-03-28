var debug = require('debug').debug('bilibili:i:extractor');
var check = require('debug').debug('bilibili:d:extractor');
var playUrl = require('bilibili-playurl');

var request = require('request-promise-native').defaults({
  gzip: true,
  resolveWithFullResponse: true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'
  }
});

var REGEX_URL_VIDEO    = /^https?:\/\/(?:www\.|bangumi\.|)bilibili\.(?:tv|com)\/(?:video\/av(\d+)(?:\/index_(\d+)\.html|\/)?)(?:\?.*)?$/i;
var REGEX_URL_BGM      = /^https?:\/\/(?:www\.|bangumi\.|)bilibili\.(?:tv|com)\/(?:anime\/(\d+)\/play#|bangumi\/play\/ep|bangumi\/play\/ss\d+#)(\d+)\/?(?:\?.*)?$/i;
var REGEX_URL_BGM_LIST = /^https?:\/\/(?:www\.|bangumi\.|)bilibili\.(?:tv|com)\/(?:anime\/(\d+)(?:\/play|\/|)|bangumi\/play\/ss(\d+)\/?)(?:\?.*)?$/i;

var parseUrl = function* (url) {
  debug(`parsing url: ${url}`);
  var type = [ REGEX_URL_VIDEO, REGEX_URL_BGM, REGEX_URL_BGM_LIST ].reverse().reduce((m, regex) => m << 1 | + regex.test(url), 0);
  if (type <= 1) {
    var resp = yield request.head(url)
      , _url = resp.request.uri.href || url;
    if (_url == url) {
      if (!type) {
        throw new Error(`${url} is an invalid url.`);
      }
    } else {
      debug(`parsing url: ${url} -> ${_url}`);
      return yield parseUrl(_url);
    }
  }
  var result = Object.assign({
    url: url,
    type: type
  }, type === 1 && {
    video_id: parseInt(REGEX_URL_VIDEO.exec(url)[1]),
    part_id: parseInt(REGEX_URL_VIDEO.exec(url)[2])
  }, type === 2 && {
    bangumi_id: parseInt(REGEX_URL_BGM.exec(url)[1]),
    episode_id: parseInt(REGEX_URL_BGM.exec(url)[2])
  }, type === 4 && {
    bangumi_id: parseInt(REGEX_URL_BGM_LIST.exec(url)[1])
  });
  debug('parsing url: success.');
  check(result);
  return result;
};

var fetchWebPage = function* (url, { cookie }) {
  debug(`fetching webpage: ${url}`);
  var { body } = yield request.get(url, {
    ...(cookie ? { headers: { 'Cookie': cookie }, } : {}),
  });
  debug('fetching webpage: success.');
  return body;
};

var checkError = function (page) {
  var error = /options=({.*})/g.exec(page.replace(/(\n| )/g, ''));
  if (error) {
    var { type, data } = eval(`(${error[1]})`)
      , reason = ({
        701: `conflicted (try ${data.url})`,
        702: 'not found',
        703: 'waiting for publish',
        704: 'waiting for review',
        705: 'authentication required (set a cookie with `-C`)'
      });
    throw new Error(`${type}: ${reason[data.code]}`);
  }
};

var checkError1 = function (state) {
  if (state.error && state.error.code) {
    var code = Math.abs(state.error.trueCode)
      , reason = ({
        403: 'articleError: authentication required, please set a cookie with `-C` and try again',
        404: 'articleError: not found'
      });
    throw new Error(`${reason[code] || 'unknown'} [code=${state.error.trueCode}, message="${state.error.message}"]`);
  }
};

var findVideoInfo = function* ({ video_id, part_id, cookie }) {
  debug(`extracting video info: av${video_id}`);
  var data = yield fetchWebPage(`https://www.bilibili.com/video/av${video_id}/` + (part_id ? `index_${part_id}.html` : ''), { cookie });
  check(data);
  var videoInfo = {};
  var state_str = /window\.__INITIAL_STATE__=({[^;]*})/g.exec(data.replace(/(\n| )/g, ''))
    , state = state_str && eval(`(${state_str[1]})`);
  if (state) {
    check(state);
    checkError1(state);
    videoInfo = Object.assign(videoInfo, {
      info: {
        title: state.videoData.title,
        creator: state.videoData.owner.name,
        creator_id: state.videoData.owner.mid,
        created_at: new Date(state.videoData.pubdate)
      }
    });
    if (!part_id) {
      // FIXME dirty workaround
      data = yield fetchWebPage(`https://www.bilibili.com/video/av${video_id}/index_1.html`, { cookie });
    }
  } else {
    checkError(data);
    videoInfo = Object.assign(videoInfo, {
      info: {
        title: /<h1 [^>]*title="([^"]*)/.exec(data)[1],
        creator: /<a [^>]*card="([^"]*)/.exec(data)[1],
        creator_id: /<a [^>]*mid="([^"]*)/.exec(data)[1],
        created_at: /<time [^>]*datetime="([^"]+)/.exec(data)[1],
      }
    });
  }
  videoInfo = Object.assign(videoInfo, {
    parts: (function (parts) {
      debug('extracting part info...');
      if (/<div id="plist"><\//.test(data)) {
        var cid = /cid=(\d+)/.exec(data)[1];
        debug(`cid = ${cid}`);
        parts.push({
          aid: video_id,
          cid: parseInt(cid),
          part_id: 1,
          index: '1'
        });
      } else {
        var i = /<option[^>]*cid='(\d+)[^>]*>(\d+)、([^<]*)/g, match;
        while ((match = i.exec(data))) {
          parts.push({
            aid: video_id,
            cid: parseInt(match[1]),
            part_id: parseInt(match[2]),
            index: match[2],
            index_title: match[3]
          });
          debug(`cid[${match[2]}] = ${match[1]}`);
        }
      }
      if (!parts.length) {
        throw new Error('cannot extract part info.');
      }
      debug('extracting part info: success.');
      return parts;
    })([])
  });
  debug('extracting video info: success.');
  check(videoInfo);
  return videoInfo;
};

var findBangumiInfo = function* ({ url, bangumi_id, cookie }) {
  debug(`extracting bangumi info: ${bangumi_id||url}`);
  var data = yield fetchWebPage(bangumi_id ? `https://bangumi.bilibili.com/anime/${bangumi_id}/play` : url, { cookie });
  var json = JSON.parse(/window.__INITIAL_STATE__=([^;]*)/.exec(data)[1]);
  check(json);
  checkError(data);
  var videoInfo = Object.assign({
    info: {
      title: json.mediaInfo.title,
      creator: json.upInfo.uname,
      creator_id: json.upInfo.mid,
      publish_at: json.pubInfo.pub_time,
    },
    season_type: json.mediaInfo.season_type,
    parts: json.epList.map(({ aid, cid, index_title, ep_id, index }) => ({
      aid, cid, index, index_title, episode_id: ep_id
    }))
  });
  debug('extracting bangumi info: success.');
  check(videoInfo);
  return videoInfo;
};

var fetchPlayInfo = function* ({ cid, quality, season_type, cookie }) {
  var url = yield playUrl(cid, { quality, season_type });
  debug(`requesting playurl: ${url}`);
  var { body } = yield request.get(url, {
      ...(cookie ? { headers: { 'Cookie': cookie }, } : {}),
      json: true
    })
    , json = body;
  check(json);
  if (json.code) {
    throw new Error(`cannot get play info, server message: "${json.message}"`);
  }
  debug('requesting playurl: success.');
  return json;
};

module.exports = {
  parseUrl, findBangumiInfo, findVideoInfo, fetchPlayInfo
};
