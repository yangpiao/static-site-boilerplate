const { extname, join } = require('path');
const renderList = require('./render-list');
const { crossReference, writeFile } = require('../utils');

function render({
  templates,
  contents: { posts, pages },
  outputDir,
  config
}) {
  templates.environment.addGlobal('$posts', posts.list);
  templates.environment.addGlobal('$tags', posts.tags);
  // TODO: xref
  templates.environment.addFilter('xref', (filename, prop) => {
    const cr = crossReference.get(filename);
    if (!cr) return null;
    prop = prop || 'url';
    return cr[prop];
  });

  const output = [];

  if (config.blog && posts.list && posts.list.length) {
    const pagingUrl = baseUrl =>
      page => page <= 1
        ? baseUrl
        : join(baseUrl, config.blog.pagination.pattern.replace('{{page}}', page));

    // posts
    const postPages = posts.list.map(post => ({
      file: join(outputDir, post._output),
      content: templates.get('blog:post').render({
        isPostPage: true,
        post: post,
        url: post.url,
        absoluteUrl: post.absoluteUrl
      })
    }));
    output.push(...postPages);

    // list page
    const indexPages = renderList({
      template: templates.get('blog:index'),
      list: posts.list,
      pagination: config.blog.pagination.count,
      url: pagingUrl(config.blog.urls.list),
      rootUrl: config.url,
      outputDir: outputDir
    });
    output.push(...indexPages);

    // tag page
    Object.values(posts.tags).forEach(tag => {
      const tagPages = renderList({
        template: templates.get('blog:tag'),
        list: tag.posts,
        pagination: config.blog.pagination.count,
        data: {
          page: { title: '#' + tag.name }
        },
        url: pagingUrl(tag.url),
        rootUrl: config.url,
        outputDir: outputDir
      });
      output.push(...tagPages);
    });
  }

  // others
  Object.entries(pages).forEach(([ name, page ]) => {
    const tplName = name.substring(0, name.length - extname(name).length);
    const template = templates.get(page.template) || templates.get(tplName);
    if (!template) {
      console.error('cannot find the template for ' + name);
      return;
    }
    output.push({
      file: join(outputDir, page._output),
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