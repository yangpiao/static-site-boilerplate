const { basename } = require('path');
const { readAll, crossReference, extractFrontMatter } = require('../utils');
const { parsePost, parsePage, parseContent } = require('./parse-file');

function getMetaForParse(file) {
  const { contents, meta = {} } = extractFrontMatter(file.contents);
  if (contents) {
    file.contents = contents;
  }
  // TODO: remove _
  meta._path = file.path;
  meta._mtime = file.stat.mtime;
  return meta;
}

function processPosts(postCache, config) {
  if (!config.blog) {
    return postCache
  };

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

  const tagUrlPattern = config.blog.urls.tag;
  Object.keys(tags).forEach(tag => {
    tags[tag].url = tagUrlPattern.replace('{{tag}}', tag);
  });

  return { tags, list };
}

async function parse({ posts, pages } = {}, config) {
  const postCache = Object.create(null);
  const pageCache = Object.create(null);
  const [ postFiles, pageFiles ] = await Promise.all([
    readAll(posts, '**/*.md'),
    readAll(pages, '**/*.md')
  ]);

  postFiles.forEach(file => {
    postCache[file.path.relative] = parsePost(getMetaForParse(file), config);
  });

  pageFiles.forEach(file => {
    pageCache[file.path.relative] = parsePage(getMetaForParse(file), config);
  });

  crossReference.init(postCache, pageCache);

  postFiles.forEach(file => {
    Object.assign(postCache[file.path.relative], parseContent(file.contents, config));
  });

  pageFiles.forEach(file => {
    Object.assign(pageCache[file.path.relative], parseContent(file.contents, config));
  });

  return {
    posts: processPosts(postCache, config),
    pages: pageCache
  };
}

module.exports = parse;