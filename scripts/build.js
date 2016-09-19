console.time('[BUILD]');
const path = require('path');
const moment = require('moment');
const props = require('../properties');
const siteConfig = require('../site.config');
const parse = require('./parse');
const loadTemplates = require('./template').load;
const render = require('./render');

const blogConfig = siteConfig.blog;
const tasks = [
  parse(props.dir.posts, siteConfig),
  loadTemplates(props.dir.templates)
];

// build
Promise.all(tasks)
  .then(([contents, templateCache]) => {
    customizeTemplateEnv(templateCache, contents);
    render(contents, templateCache, siteConfig, props.dir.build);
    console.timeEnd('[BUILD]');
  })
  .catch(error => console.error(error));


function customizeTemplateEnv(templateCache, contents) {
  templateCache.addFilter('time', (input, format) => moment(input).format(format));
  templateCache.addFilter('absoluteUrl', url =>
    siteConfig.url.replace(/\/$/, '') + path.join('/', url));
  templateCache.addGlobal('$fn', {
    now: Date.now,
    joinPaths: path.join.bind(path)
  });
  templateCache.addGlobal('$allPosts', contents.list);
  templateCache.addGlobal('$tagPosts', contents.byTag);
  templateCache.addGlobal('$tags', contents.tags);
  templateCache.addGlobal('$tagUrls', contents.tagUrls);
  templateCache.addGlobal('$site', siteConfig);
}
