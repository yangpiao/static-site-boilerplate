const { extname, join } = require('path');
const parseMarkdown = require('./parse-markdown');

function parseFile(data, type, config) {
  data._name = data._path.basename;

  if (!data.url) {
    const relative = data._path.relative;
    const ext = extname(relative);
    data.url = relative.substring(0, relative.length - ext.length);
  }
  if (type === 'post') {
    data.url = config.blog.urls.post.replace('{{post}}', data.url);
    data.absoluteUrl = config.url + join('/', data.url);
    if (!typeof data.tags === 'string') {
      data.tags = [ data.tags ];
    } else if (!Array.isArray(data.tags)) {
      data.tags = [];
    }
  } else {
    data.url = join('/', data.url);
    data.absoluteUrl = config.url + data.url;
  }
  if (extname(data.url)) {
    data._output = data.url;
  } else {
    data._output = join(data.url, 'index.html');
  }

  const time = Date.parse(data.time);
  if (!isNaN(time)) {
    data.time = new Date(time);
  } else {
    data.time = new Date();
  }
  data.author = data.author || config.author;

  return data;
}

module.exports = {
  parsePost(data, config) {
    return parseFile(data, 'post', config);
  },
  parsePage(data, config) {
    return parseFile(data, 'page', config);
  },
  parseContent: parseMarkdown
};