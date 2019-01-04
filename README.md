# bilibili-get

[![Build Status](https://travis-ci.org/kamikat/bilibili-get.svg?branch=master)](https://travis-ci.org/kamikat/bilibili-get)
[![Coverage Status](https://coveralls.io/repos/github/kamikat/bilibili-get/badge.svg?branch=master)](https://coveralls.io/github/kamikat/bilibili-get?branch=master)
[![npm version](https://badge.fury.io/js/bilibili-get.svg)](https://badge.fury.io/js/bilibili-get)

youtube-dl like command-line tool resolving & downloading media files from bilibili.

## Features

- Video quality selection
- Auto-merging video segments
- Premium account bangumi (with `-C` option)

bilibili-get supports downloading video from following type of urls:

| URL                             | Playlist | Example                                                 |
| ------------------------------- | :------: | ------------------------------------------------------- |
| User-uploaded Video             |          | `https://www.bilibili.com/video/av18182135`             |
| User-uploaded Video (multipart) |    ✓     | `https://www.bilibili.com/video/av1041170`              |
| User-uploaded Video (multipart) |          | `https://www.bilibili.com/video/av1041170/index_5.html` |
| Movie Bangumi                   |          | `https://www.bilibili.com/bangumi/play/ss12364/`        |
| TV Bangumi (A)                  |    ✓     | `https://bangumi.bilibili.com/anime/5796`               |
| Bangumi Episode (A)             |          | `https://bangumi.bilibili.com/anime/5786/play#100367`   |
| TV Bangumi (B)                  |    ✓     | `https://www.bilibili.com/bangumi/play/ss5796`          |
| Bangumi Episode (B1)            |          | `https://www.bilibili.com/bangumi/play/ep100611`        |
| Bangumi Episode (B2)            |          | `https://www.bilibili.com/bangumi/play/ss21769#173345`  |
| TV Bangumi (C)                  |    ✓     | `https://www.bilibili.com/bangumi/media/md8892/`        |
| URL Redirect                    |          | `https://acg.tv/av106`                                  |

## Installation

Install via NPM:

```
npm install -g bilibili-get
```

bilibili-get uses [aria2](https://aria2.github.io) and [ffmpeg](https://ffmpeg.org) for downloading and video segment merging.
They can be easily installed with a package manager.

For [Homebrew](https://brew.sh) users:

```
brew install ffmpeg aria2
```

For Linux/Windows users, make sure to have **aria2 &gt; 1.23.0** installed.

## Usage

```
bilibili-get https://www.bilibili.com/video/av18182135
```

bilibili-get exposes similar interface with youtube-dl.

```
Usage: bilibili-get [options] <url>


Options:

  -o, --output [pattern]              set output pattern (default: av%(aid)s %(title)s%(#index&&"\(")s%(index)s%(#index&&"\)")s%(#index_title&&" ")s%(index_title)s.%(ext)s)
  -f, --output-format [format]        set merged output format [flv/mkv/mp4]
  -q, --quality [value]               set video quality (default: 0)
  -l, --list-formats                  list available format/quality for video(s)
  -C, --cookie [cookieString]         set cookie string
  -O, --download-options [key=value]  set extra aria2c command-line options (default: )
  -d, --dry-run                       run the program without any download
  -s, --silent                        suppress video quality output
  -V, --version                       output the version number
  -h, --help                          output usage information
```

The `-o` flag accepts an output template string in [python string formatting method](https://docs.python.org/2/library/stdtypes.html#string-formatting).
Besides typical string formatting options, bilibili-get supports JavaScript expressions replacement expressed by syntax like `%(#1+1)d`.

And some of the variables are:

- `aid` - the XXXXXX in avXXXXXX
- `cid` - media resource id
- `ext` - extension name of the output file (can be set by `-f` option)
- `title` - title of video or bangumi
- `index` - part# of a part in video or episode# of an episode in bangumi
- `index_title` - a part name or bangumi episode title
- `episode_id` - id of a bangumi episode
- `bangumi_id` - id of a bangumi
- `quality` - quality id of resolved video
- `format` - format name corresponding to the video quality

### Examples

#### List video quality/format

```
bilibili-get https://www.bilibili.com/video/av18182135 -l
```

#### Quality

```
bilibili-get https://www.bilibili.com/video/av18182135 -q 64  # 720P
bilibili-get https://www.bilibili.com/video/av18182135 -q 80  # 1080P
bilibili-get https://www.bilibili.com/video/av18182135 -q 112 # 1080P 4Kbps
```

#### Merge parts to MKV file

```
bilibili-get https://www.bilibili.com/video/av18182135 -f mkv
```

#### Bangumi

```
bilibili-get -o 'av%(aid)s - %(title)s/%(index)s%(#index_title&&" - ")s%(index_title)s.%(ext)s' -f mkv https://www.bilibili.com/bangumi/play/ss1512
```

#### Cookie of premium account

```
bilibili-get -C 'DedeUserID=XXXXXX; DedeUserID__ckMd5=b199851b45c91f32; sid=XXXXXXXX; SESSDATA=cf33becc%2C1241112410%2A332c1323;' -q 112 -f mkv https://www.bilibili.com/bangumi/play/ss1512
```

#### Multiple connection download

```
bilibili-get https://www.bilibili.com/video/av18182135 -O split=5 -O max-connection-per-server=5
```

#### Download speed limit

```
bilibili-get https://www.bilibili.com/video/av18182135 -O max-download-limit=300K
```

## License

(The MIT License)
