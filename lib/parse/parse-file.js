const { extname, join } = require('path');

function parseFile(type, pageData, fileMeta, config) {
  let { author, tags, time, url } = pageData;
  let absoluteUrl = '';

  if (!url) {
    const relative = fileMeta.path.relative;
    const ext = extname(relative);
    url = relative.substring(0, relative.length - ext.length);
  }
  if (type === 'post') {
    url = config.blog.urls.post.replace('{{post}}', url);
    absoluteUrl = join(config.url, '/', url);
  } else {
    url = join('/', url);
    absoluteUrl = join(config.url, url);
  }

  if (!author) {
    author = config.author;
  }

  if (!typeof tags === 'string') {
    tags = [ tags ];
  } else if (!Array.isArray(tags)) {
    tags = [];
  }
  tags.sort();

  time = Date.parse(time);
  if (!isNaN(time)) {
    time = new Date(time);
  } else {
    time = new Date();
  }

  return { url, absoluteUrl, author, tags, time };
}

module.exports = parseFile;