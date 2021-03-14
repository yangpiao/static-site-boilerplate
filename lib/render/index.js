const { extname, join } = require('path');
const renderList = require('./render-list');
const { getCrossReference, writeFile } = require('../utils');

function getPageUrlFn(pageUrlPattern, baseUrl) {
  return function getPageUrl(page) {
    if (page <= 1) {
      return baseUrl;
    }
    return join(baseUrl, pageUrlPattern.replace('{{page}}', page));
  }
}

function render({
  data: { contents, meta, pages, posts, tags },
  templates,
  config,
  outputDir
}) {
  const allPosts = posts.map(key => contents[key]);
  const allTags = tags.map(tag => contents[`tag:${tag}`]);

  templates.environment.addGlobal('$posts', allPosts);
  templates.environment.addGlobal('$tags', allTags);

  templates.environment.addFilter('tagUrl', tag => {
    const data = contents[`tag:${tag}`];
    return data?.url;
  });

  // cross reference template helper
  templates.environment.addFilter('xref', (filename, prop = 'url') => {
    const cr = getCrossReference(filename, contents);
    return cr && cr[prop] || null;
  });

  const output = [];
  const pageSize = config.blog?.pagination?.count || 10;
  const pageUrlPattern = config.blog?.pagination?.pattern || '/page/{{page}';

  if (posts.length) {
    // posts
    const postTemplate = templates.get('blog:post');
    posts.forEach(post => {
      const filePath = join(outputDir, meta[post].outputPath);
      const context = Object.assign({ isPostPage: true }, contents[post]);
      output.push({
        filePath,
        fileContent: postTemplate.render(context)
      });
    });

    // list page
    const indexPages = renderList({
      pageSize,
      outputDir,
      contents,
      list: posts,
      template: templates.get('blog:index'),
      rootUrl: config.url,
      getPageUrl: getPageUrlFn(pageUrlPattern, config.blog?.urls?.index || '/'),
      context: {}
    });
    output.push(...indexPages);

    // tag page
    allTags.forEach(tag => {
      const tagPages = renderList({
        pageSize,
        outputDir,
        contents,
        list: tag.posts,
        template: templates.get('blog:tag'),
        rootUrl: config.url,
        getPageUrl: getPageUrlFn(pageUrlPattern, tag.url),
        context: {
          title: `#${tag.name}`
        }
      });
      output.push(...tagPages);
    });
  }

  // others
  pages.forEach(page => {
    const filePath = join(outputDir, meta[page].outputPath);
    const context = Object.assign({}, contents[page]);
    // gets the template for the page
    const name = meta[page].path.relative;
    const tplName = name.substring(0, name.length - extname(name).length);
    const template = templates.get(contents[page].template) || templates.get(tplName);
    if (!template) {
      console.error('cannot find the template for ' + name);
      return;
    }
    output.push({
      filePath,
      fileContent: template.render(context)
    });
  });

  return Promise.all(
    output.map(({filePath, fileContent}) => writeFile(filePath, fileContent))
  );
}

module.exports = render;