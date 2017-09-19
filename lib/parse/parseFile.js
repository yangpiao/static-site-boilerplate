const path = require('path');
const frontMatter = require('./frontMatter');
const markdown = require('./markdown');
const config = require('../config');

function parseFile(file, type) {
  const relativePath = file.path.relative;
  const data = {
    _name: path.basename(relativePath),
    _path: file.path,
    _mtime: file.stat.mtime
  };
  const meta = frontMatter(file);
  Object.assign(data, meta);

  if (!data.url) {
    const ext = path.extname(relativePath);
    data.url = relativePath.substring(0, relativePath.length - ext.length);
  }
  if (type === 'post') {
    data.url = config.blog.urls.post.replace('{{post}}', data.url);
    data.absoluteUrl = config.site.url + path.join('/', data.url);
    if (!typeof data.tags === 'string') {
      data.tags = [ data.tags ];
    } else if (!Array.isArray(data.tags)) {
      data.tags = [];
    }
  } else {
    data.absoluteUrl = config.site.url + path.join('/', data.url);
  }
  if (path.extname(data.url)) {
    data._output = data.url;
  } else {
    data._output = path.join(data.url, 'index.html');
  }

  const time = Date.parse(data.time);
  if (!isNaN(time)) {
    data.time = new Date(time);
  } else {
    data.time = new Date();
  }
  data.author = data.author || config.site.author;

  return data;
}

module.exports = {
  parsePost: file => parseFile(file, 'post'),
  parsePage: file => parseFile(file, 'page'),
  parseContent: file => markdown(file.contents)
};
