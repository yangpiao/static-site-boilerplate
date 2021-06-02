const yaml = require('js-yaml');
const { EOL } = require('os');

const START = /^[-]{3,}$/;
const END = /^[\.]{3,}$/;
const H1 = /^#[\s]+[\S]+/;

function extractFrontMatter(fileContents) {
  const lines = fileContents.split(/[\r\n]/);
  let endLineNumber = -1;
  let frontMatter = {};

  // the file has to start with the front matter
  if (START.test(lines[0])) {
    endLineNumber = lines.findIndex(line => END.test(line));
    if (endLineNumber === -1) {
      endLineNumber = 0;
    }
    frontMatter = yaml.load(lines.slice(1, endLineNumber).join(EOL));
  }

  if (!frontMatter.title) {
    let title = '';
    // finding the first h1
    for (let i = endLineNumber + 1; i < lines.length; i++) {
      const text = lines[i].trim();
      if (text) {
        if (H1.test(text)) {
          endLineNumber = i;
          title = text.substring(1).trim();
        }
        break;
      }
    }
    frontMatter.title = title || 'Untitled';
  }

  const content = lines.slice(endLineNumber + 1).join(EOL);

  return { content, frontMatter };
}

module.exports = extractFrontMatter;