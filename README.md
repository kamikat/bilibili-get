# bilibili-get

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
| TV Bangumi (A)                  |    ✓     | `http://bangumi.bilibili.com/anime/5796`                |
| Bangumi Episode (A)             |          | `http://bangumi.bilibili.com/anime/5786/play#100367`    |
| TV Bangumi (B)                  |    ✓     | `https://www.bilibili.com/bangumi/play/ss5796`          |
| Bangumi Episode (B1)            |          | `https://www.bilibili.com/bangumi/play/ep100611`        |
| Bangumi Episode (B2)            |          | `https://www.bilibili.com/bangumi/play/ss21769#173345`  |
| Redirect to Bilibili            |          |                                                         |

## Installation

```
npm i -g bilibili-get
```

bilibili-get depends on [aria2](https://aria2.github.io) and [ffmpeg](https://ffmpeg.org) to work.
They can be easily installed with a package manager. For [Homebrew](https://brew.sh) users:

```
brew install ffmpeg aria2
```

## Usage

```
bilibili-get https://www.bilibili.com/video/av18182135
```

bilibili-get exposes similar interface with youtube-dl.

```
Usage: bilibili-get [options] <url>


Options:

  -o, --output [pattern]        set output pattern (default: av%(aid)s %(title)s%(#index&&"\(")s%(index)s%(#index&&"\)")s%(#index_title&&" ")s%(index_title)s.%(ext)s)
  -f, --output-format [format]  set merged output format [flv/mkv/mp4]
  -q, --quality [value]         set video quality (default: 0)
  -l, --list-formats            list available format/quality for video(s)
  -C, --cookie [value]          set cookie string
  -d, --dry-run                 run the program without any download
  -s, --silent                  suppress video quality output
  -V, --version                 output the version number
  -h, --help                    output usage information
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

Get video quality/format id:

```
bilibili-get https://www.bilibili.com/video/av18182135 -l
```

Download 720P video files:

```
bilibili-get https://www.bilibili.com/video/av18182135 -q 64
```

By default, bilibili-get detects format of output video. Use `-f` to set the merged video format.
For example, merge video segments to `.mkv` file:

```
bilibili-get https://www.bilibili.com/video/av18182135 -f mkv
```

Download bangumi:

```
bilibili-get -o 'av%(aid)s - %(title)s/%(index)s%(#index_title&&" - ")s%(index_title)s.%(ext)s' -f mkv https://www.bilibili.com/bangumi/play/ss1512
```

Use a premium account for better quality:

```
bilibili-get -C 'DedeUserID=XXXXXX; DedeUserID__ckMd5=b199851b45c91f32; sid=XXXXXXXX; SESSDATA=cf33becc%2C1241112410%2A332c1323;' -q 112 -f mkv https://www.bilibili.com/bangumi/play/ss1512
```

## License

(The MIT License)
