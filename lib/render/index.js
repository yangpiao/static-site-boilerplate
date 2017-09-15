const path = require('path');
const renderList = require('./render-list');
const config = require('../config');
const { writeFile } = require('../utils');

const basename = name => path.basename(name, path.extname(name));

function render({ posts, pages }, templateCache, outputDir) {
  templateCache.customize({
    globals: {
      $allPosts: posts.list,
      $tags: posts.tags
    }
  });

  const pagingUrl = config.blog.pagingUrlPattern;
  const pagination = config.blog.pagination;
  const output = [];

  // posts
  const postPages = posts.list.map(post => ({
    file: path.join(outputDir, post._output),
    content: templateCache.special.post.render({
      isPostPage: true,
      post: post,
      url: post.url,
      absoluteUrl: post.absoluteUrl
    })
  }));
  output.push(...postPages);

  // list page
  const indexPages = renderList({
    template: templateCache.special.index,
    list: posts.list,
    pagination,
    url: page => {
      if (page > 1) {
        return pagingUrl.replace('{{page}}', page);
      } else {
        return '/';
      }
    },
    outputDir: outputDir
  });
  output.push(...indexPages);

  // tag page
  Object.values(posts.tags).forEach(tag => {
    const tagPages = renderList({
      template: templateCache.special.tag,
      list: tag.posts,
      pagination,
      data: {
        page: { title: '#' + tag.name }
      },
      url: page => {
        if (page > 1) {
          return path.join(tag.url, pagingUrl.replace('{{page}}', page));
        } else {
          return tag.url;
        }
      },
      outputDir: outputDir
    });
    output.push(...tagPages);
  });

  // others
  const otherPages = Object.keys(templateCache.templates).map(name => ({
    file: path.join(outputDir, name),
    content: templateCache.templates[name].render({
      url: path.join('/', name.replace(/(\/|^)index.html$/i, '')),
      page: pages[basename(name)] || pages[name] || {}
    })
  }));
  output.push(...otherPages);

  return Promise.all(output.map(({file, content}) => writeFile(file, content)));
}

module.exports = render;
