const yaml = require('js-yaml');
const { EOL } = require('os');

const START = /^[-]{3,}$/;
const END = /^[\.]{3,}$/;

function extractFrontMatter(fileContents) {
  const lines = fileContents.split(/[\r\n]/);

  // the file has to start with the front matter
  if (!START.test(lines[0])) {
    return {};
  }

  const endLineNumber = lines.findIndex(line => END.test(line));
  if (endLineNumber === -1) {
    return {};
  }

  const content = lines.slice(endLineNumber + 1).join(EOL);
  const metaLines = lines.slice(1, endLineNumber);
  const frontMatter = yaml.load(metaLines.join(EOL));

  return { content, frontMatter };
}

module.exports = extractFrontMatter;