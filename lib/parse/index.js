const path = require('path');
const config = require('../config');
const { readAll } = require('../utils');
const { parsePost, parsePage, parseContent } = require('./parseFile');
const crossReference = require('./crossReference');

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
    postCache[file.path.relative] = parsePost(file);
  });
  pageFiles.forEach(file => {
    pageCache[file.basename] = pageCache[file.path.relative] = parsePage(file);
  });
  crossReference.set(postCache);
  postFiles.forEach(file => {
    Object.assign(postCache[file.path.relative], parseContent(file));
  });
  pageFiles.forEach(file => {
    Object.assign(pageCache[file.basename], parseContent(file));
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
    tags[tag].absoluteUrl = path.join(config.site.url, tags[tag].url);
  });

  return { tags, list };
}

module.exports = parse;
