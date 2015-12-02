'use strict';

var argv = require('yargs').argv;

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var watch = require('gulp-watch');
var batch = require('gulp-batch');

gulp.task('default', bundle);

var ignoreErr = false;

function bundle() {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './src/browser.js',
    debug: true
  });
  return b.bundle()
    .on('error', function() {
      gutil.log.apply(gutil, arguments);
      if(ignoreErr) this.emit('end');
    })
    .pipe(source('namefuck.js'))
    .pipe(buffer())
    .pipe(gulpif(!argv.debug, stripDebug()))
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(gulpif(!argv.debug, uglify()))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'));
}

//TODO watchify
gulp.task('watch', function(cb) {
  function build() {
    console.log('building...');
    var t = +new Date;
    return bundle().on('end', function() {
      console.log('build finished. took '+(+new Date - t)+'ms.');
    });
  }
  build();
  ignoreErr = true;
  watch('src/*.js', batch(function(events, done) {
    build().on('end', done);
  }));
});