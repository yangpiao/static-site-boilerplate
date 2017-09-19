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

  const output = [];

  if (config.blog) {
    const { templates, urls, pagination } = config.blog;
    const pagingUrl = baseUrl =>
      page => page <= 1 ? baseUrl :
        path.join(baseUrl, pagination.pattern.replace('{{page}}', page));

    // posts
    const postPages = posts.list.map(post => ({
      file: path.join(outputDir, post._output),
      content: templateCache.blog[templates.post].render({
        isPostPage: true,
        post: post,
        url: post.url,
        absoluteUrl: post.absoluteUrl
      })
    }));
    output.push(...postPages);

    // list page
    const indexPages = renderList({
      template: templateCache.blog[templates.list],
      list: posts.list,
      pagination: pagination.count,
      url: pagingUrl(urls.list),
      outputDir: outputDir
    });
    output.push(...indexPages);

    // tag page
    Object.values(posts.tags).forEach(tag => {
      const tagPages = renderList({
        template: templateCache.blog[templates.tag],
        list: tag.posts,
        pagination: pagination.count,
        data: {
          page: { title: '#' + tag.name }
        },
        url: pagingUrl(tag.url),
        outputDir: outputDir
      });
      output.push(...tagPages);
    });
  }

  // others
  const tplPages = templateCache.pages;
  Object.entries(pages).forEach(([ name, page ]) => {
    let defaultTpl = page.url;
    if (!path.extname(page.url)) defaultTpl += '.html';
    const template = (page.template && tplPages[page.template]) || tplPages[defaultTpl];
    if (!template) {
      console.error('cannot find the template for ' + name);
      return;
    }
    output.push({
      file: path.join(outputDir, page._output),
      content: template.render({
        url: page.url,
        absoluteUrl: page.absoluteUrl,
        page
      })
    });
  });

  return Promise.all(output.map(({file, content}) => writeFile(file, content)));
}

module.exports = render;
