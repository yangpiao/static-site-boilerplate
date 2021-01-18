const SRC = 'src';
const BUILD = 'build';
const CONFIG = './site-config.yml';
const dir = {
  build: BUILD,
  css: `${BUILD}/css`,
  src: SRC,
  posts: `${SRC}/posts`,
  pages: `${SRC}/pages`,
  templates: `${SRC}/templates`,
  styles: `${SRC}/styles`,
  static: `${SRC}/website`,
};
module.exports = {
  dir,
  builder: [
    'node',
    './lib/build.js',
    `--site-config=${CONFIG}`,
    `--templates=${dir.templates}`,
    `--posts=${dir.posts}`,
    `--pages=${dir.pages}`,
    `--output=${dir.build}`
  ],
  sass: [
    'yarn sass',
    '--style compressed',
    `${dir.styles}:${dir.css}`
  ]
};
