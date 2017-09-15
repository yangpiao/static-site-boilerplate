const path = require('path');
const glob = require('glob');
const markdown = require('./markdown');
const config = require('../config');
const { readAll } = require('../utils');

function parseFile(file) {
  return Object.assign({
    _name: path.basename(file.path.relative),
    _path: file.path,
    _mtime: file.stat.mtime,
    _output: ''
  }, markdown(file.contents));
}

async function parse(dir) {
  dir = dir || {};
  const { posts, pages } = dir;
  const postCache = Object.create(null);
  const pageCache = Object.create(null);
  const [ postFiles, pageFiles ] = await Promise.all([
    readAll(posts, '**/*.md'),
    readAll(pages, '**/*.md')
  ]);
  postFiles.forEach(file => {
    postCache[file.path.relative] = parseFile(file);
  });
  pageFiles.forEach(file => {
    pageCache[file.path.relative] = parseFile(file);
  });
  return {
    posts: processPosts(postCache),
    pages: pageCache
  };
}

function processPosts(postCache) {
  const tags = {};
  const list = Object.values(postCache).sort((p1, p2) => (p2.time - p1.time));

  list.forEach((post, i) => {
    post.author = post.author || config.site.author;
    // url
    if (!post.url) {
      const relativePath = post._path.relative;
      const ext = path.extname(relativePath);
      post.url = relativePath.substring(0, relativePath.length - ext.length);
    }
    post.url = path.join(config.blog.postUrlPrefix, post.url);
    if (path.extname(post.url)) {
      post._output = post.url;
    } else {
      post._output = path.join(post.url, 'index.html');
    }
    // navigation
    if (list[i + 1]) {
      post.older = list[i + 1];
    }
    if (list[i - 1]) {
      post.newer = list[i - 1];
    }
    // tags
    post.tags.forEach(tag => {
      if (!tags[tag]) {
        tags[tag] = {
          name: tag,
          posts: []
        };
      }
      tags[tag].posts.push(post);
    });
  });

  const tagUrlPattern = config.blog.tagUrlPattern;
  Object.keys(tags).forEach(tag => {
    tags[tag].url = tagUrlPattern.replace('{{tag}}', tag);
  });

  return { tags, list };
}

module.exports = parse;
