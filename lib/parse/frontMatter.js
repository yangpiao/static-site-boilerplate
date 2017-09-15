const yaml = require('js-yaml');
const FRONT_MATTER_START = '---\n';
const FRONT_MATTER_END = '\n...\n';

module.exports = function frontMatter(file) {
  if (file.contents.indexOf(FRONT_MATTER_START) !== 0) return {};
  const index = file.contents.indexOf(FRONT_MATTER_END);
  const meta = file.contents.substring(FRONT_MATTER_START.length, index);
  file.contents = file.contents.substring(index + FRONT_MATTER_END.length);
  return meta ? yaml.safeLoad(meta) : {};
};
