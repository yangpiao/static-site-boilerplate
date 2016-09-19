const gulp = require('gulp');
const exec = require('child_process').exec;
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const browserSync = require('browser-sync').create();
const properties = require('./properties');
const allFiles = '/**/*';
const glob = {
  posts: properties.dir.posts + allFiles + '.md',
  templates: properties.dir.templates + allFiles + '.{html,xml}',
  static: properties.dir.static + allFiles + '',
  styles: properties.dir.styles + allFiles + '.scss'
};

gulp.task('clean', callback => {
  exec('rm -rf ' + properties.dir.build, callback);
});

gulp.task('build:src', callback => {
  exec('node ' + properties.buildScript, callback);
});

gulp.task('build:static', () =>
  gulp.src(glob.static)
    .pipe(gulp.dest(properties.dir.build))
);

gulp.task('styles', () =>
  gulp.src(glob.styles)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer({ browsers: ['last 5 versions', 'not ie <= 8'] }),
      cssnano()
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(properties.dir.build + '/css'))
);

gulp.task('build', ['build:src', 'build:static', 'styles']);
gulp.task('default', ['clean', 'build']);

const reload = callback => {
  browserSync.reload();
  callback();
};
gulp.task('watch:styles', ['styles'], reload);
gulp.task('watch:src', ['build:src'], reload);
gulp.task('watch:static', ['build:static'], reload);

gulp.task('serve', ['default'], () => {
  browserSync.init({
    server: {
      baseDir: properties.dir.build
    }
  });
  gulp.watch([glob.posts, glob.templates, './site.config.js', './scripts/**/*'],
             ['watch:src']);
  gulp.watch(glob.static, ['watch:static']);
  gulp.watch(glob.styles, ['watch:styles']);
});
