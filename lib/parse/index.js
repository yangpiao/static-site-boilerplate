const { extname, join } = require('path');
const { readAll, extractFrontMatter } = require('../utils');
const parseFile = require('./parse-file');
const parseMarkdown = require('./parse-markdown');

function getDataForParse(type, file, config) {
  const {
    content,
    frontMatter: pageData = {}
  } = extractFrontMatter(file.contents);

  const fileMeta = {
    path: file.path,
    mtime: file.stat.mtime,
    rawContent: content || ''
  };

  const data = parseFile(type, pageData, fileMeta, config);
  Object.assign(pageData, data);

  if (extname(pageData.url)) {
    fileMeta.outputPath = pageData.url;
  } else {
    fileMeta.outputPath = join(pageData.url, 'index.html');
  }

  return { fileMeta, pageData };
}

function setNeighbors(posts, contents) {
  posts.forEach((key, i, list) => {
    const post = contents[key];
    if (list[i + 1] && contents[list[i + 1]]) {
      const { url, absoluteUrl, title, time, author, tags } = contents[list[i + 1]];
      post.previousPost = { url, absoluteUrl, title, time, author, tags };
    }
    if (list[i - 1] && contents[list[i - 1]]) {
      const { url, absoluteUrl, title, time, author, tags } = contents[list[i - 1]];
      post.previousPost = { url, absoluteUrl, title, time, author, tags };
    }
  });
}

function extractTags(posts, contents, tagUrlPattern = '/tag/{{tag}}') {
  const tags = [];

  posts.forEach(post => {
    contents[post].tags.forEach(tag => {
      const tagKey = `tag:${tag}`;
      if (!contents[tagKey]) {
        contents[tagKey] = {
          name: tag,
          url: tagUrlPattern.replace('{{tag}}', tag),
          posts: []
        };
        tags.push(tag);
      }
      contents[tagKey].posts.push(post);
    });
  });

  tags.sort();
  tags.forEach(tag => {
    contents[`tag:${tag}`].posts.sort((p1, p2) => (contents[p2].time - contents[p1].time));
  });

  return tags;
}

async function parse(paths, config) {
  const contents = Object.create(null);
  const meta = Object.create(null);
  const lists = Object.create(null);

  const types = [ 'post', 'page' ];
  const files = await Promise.all([
    readAll(paths.posts, '**/*.md'),
    readAll(paths.pages, '**/*.md')
  ]);

  types.forEach((type, i) => {
    lists[type] = [];
    files[i].forEach(file => {
      const { fileMeta, pageData } = getDataForParse(type, file, config);
      const key = `${type}:${file.path.relative}`;
      lists[type].push(key);
      contents[key] = pageData;
      meta[key] = fileMeta;
    });
  });

  // parses markdown
  Object.keys(meta).forEach(key => {
    const data = contents[key];
    if (!data) {
      return;
    }
    Object.assign(data, parseMarkdown(meta[key].rawContent, contents));
  });

  const { post: posts, page: pages } = lists;

  // sorts posts
  posts.sort((p1, p2) => (contents[p2].time - contents[p1].time));

  // prev & next references
  setNeighbors(posts, contents);

  // extracts all tags
  const tags = extractTags(posts, contents, config.blog?.urls?.tag);

  return { contents, meta, pages, posts, tags };
}

module.exports = parse;