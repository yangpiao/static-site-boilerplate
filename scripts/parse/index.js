const path = require('path');
const glob = require('glob');
const readAll = require('./read-all');
const markdown = require('./markdown');

const fileCache = Object.create(null);
const postCache = Object.create(null);

module.exports = (dir, siteConfig) =>
  readAll(dir)
    .then(files => {
      files.forEach(file => {
        fileCache[file.$id] = {
          $id: file.$id,
          name: path.basename(file.path.relative),
          path: file.path,
          mtime: file.stat.mtime
        };
        postCache[file.$id] = markdown(file);
      });
      return processPosts({
        files: fileCache,
        posts: postCache
      }, siteConfig);
    });


function processPosts(contents, siteConfig) {
  const fileCache = contents.files;
  const posts = Object.keys(contents.posts)
    .map(key => contents.posts[key])
    .sort((p1, p2) => (p2.time - p1.time));
  const byTag = {};
  posts.forEach((post, i) => {
    post.author = post.author || siteConfig.author;
    // url
    if (!post.url) {
      const relativePath = fileCache[post.$id].path.relative;
      const ext = path.extname(relativePath);
      post.url = relativePath.substring(0, relativePath.length - ext.length);
    }
    post.url = path.join(siteConfig.blog.postUrlPrefix, post.url);
    if (path.extname(post.url)) {
      fileCache[post.$id].output = post.url;
    } else {
      fileCache[post.$id].output = path.join(post.url, 'index.html');
    }
    // navigation
    if (posts[i + 1]) {
      post.older = posts[i + 1];
    }
    if (posts[i - 1]) {
      post.newer = posts[i - 1];
    }
    // tags
    post.tags.forEach(tag => {
      if (!byTag[tag]) {
        byTag[tag] = [];
      }
      byTag[tag].push(post);
    });
  });

  contents.list = posts;
  contents.byTag = byTag;
  contents.tags = Object.keys(byTag).sort();
  contents.tagUrls = {};
  const tagUrlPattern = siteConfig.blog.tagUrlPattern;
  contents.tags.forEach(tag => {
    contents.tagUrls[tag] = tagUrlPattern.replace('{{tag}}', tag);
  });
  return contents;
}
