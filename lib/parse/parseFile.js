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

  if (type === 'post') {
    if (!data.url) {
      const ext = path.extname(relativePath);
      data.url = relativePath.substring(0, relativePath.length - ext.length);
    }
    data.url = path.join(config.blog.postUrlPrefix, data.url);
    data.absoluteUrl = path.join(config.site.url, data.url);
    if (path.extname(data.url)) {
      data._output = data.url;
    } else {
      data._output = path.join(data.url, 'index.html');
    }

    if (!typeof data.tags === 'string') {
      data.tags = [ data.tags ];
    } else if (!Array.isArray(data.tags)) {
      data.tags = [];
    }
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
