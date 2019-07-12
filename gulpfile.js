const { src, dest, series, parallel, watch } = require('gulp');
const { exec } = require('child_process');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();

const properties = require('./properties');
const glob = {
  posts: `${properties.dir.posts}/**/*.md`,
  pages: `${properties.dir.pages}/**/*.md`,
  templates: `${properties.dir.templates}/**/*.{html,xml}`,
  static: `${properties.dir.static}/**/*`,
  styles: `${properties.dir.styles}/**/*.scss`,
  css: `${properties.dir.css}/**/*.css`
};
const watchedFiles = {
  src: [
    glob.posts,
    glob.pages,
    glob.templates,
    './site.config.yml',
    './lib/**/*'
  ],
  static: glob.static,
  styles: glob.styles
};

// >>>>>>>>>> tasks <<<<<<<<<<

const clean = callback => exec(`rm -rf ${properties.dir.build}`, callback);

const buildSrc = callback => exec(properties.builder.join(' '), callback);

const buildStatic = () => src(glob.static).pipe(dest(properties.dir.build));

const buildSass = callback => exec(properties.sass.join(' '), callback);
const buildPostcss = () =>
  src(glob.css)
    .pipe(postcss([ autoprefixer() ]))
    .pipe(dest(properties.dir.css));
const buildStyles = series(buildSass, buildPostcss);

const build = parallel(buildSrc, buildStatic, buildStyles);

const reload = callback => {
  browserSync.reload();
  callback();
};

const serve = () => {
  browserSync.init({
    server: {
      baseDir: properties.dir.build
    }
  });

  watch(watchedFiles.src, { ignoreInitial: false }, series(buildSrc, reload));
  watch(watchedFiles.static, { ignoreInitial: false }, series(buildStatic, reload));
  watch(watchedFiles.styles, { ignoreInitial: false }, series(buildStyles, reload));
};

Object.assign(exports, {
  clean,
  buildSrc,
  buildStatic,
  buildStyles,
  build,
  serve
});
exports.default = series(clean, build);

