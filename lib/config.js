const fs = require('fs');
const yaml = require('js-yaml');
const utils = require('./utils');

const config = {};
config.load = async function(filePath) {
  const file = await utils.readFile(filePath);
  const site = yaml.safeLoad(file.contents);
  const blog = site.blog || {};
  delete site.blog;
  config.site = site;
  config.blog = blog;
  return { site, blog };
};

module.exports = config;
