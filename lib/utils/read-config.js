const yaml = require('js-yaml');
const readFile = require('./read-file');

module.exports = async function readConfig(configFile) {
  const file = await readFile(configFile);
  const config = yaml.load(file.contents);
  config.url = config.url.replace(/\/$/, '');
  return config;
};