'use strict';

// use a regular es5 gulpfile
//  -> so we can really test what is using a Babel compiled module

var del           = require('del');
var gulp          = require('gulp');
var gutil         = require('gulp-util');
var babel         = require('gulp-babel');
var jsbeautifier  = require('gulp-jsbeautifier');
var merge         = require('merge-stream');
var concat        = require('gulp-concat');
var rc            = require('rc')('gds');
var argv          = require('yargs').argv;

gulp.task('clean-build', function (cb) {
  return del(['dist'], cb);
});

gulp.task('build', ['clean-build'], function () {
  var jsBabel = gulp
    .src('src/*.js')
    .pipe(babel({
      presets:  ['es2015'],
    }));
  var listFiles = gulp
    .src('src/*.list');
  return merge(jsBabel, listFiles)
    .pipe(gulp.dest('dist'));
});

// test dump task
gulp.task('clean-dump', function (cb) {
  return del(['tmp'], cb);
});

gulp.task('dump', ['clean-dump'], function () {
  var dumpify       = require('./dist/index');
  return dumpify({
    domain:   rc.domain,
    apikey:   rc.apikey,
    password: rc.password,
    debug:    argv.debug != null,
  })
  // better to have a nice indentation
  .pipe(jsbeautifier({
    indentSize: 2,
    logSuccess: false
  }))
  .pipe(gulp.dest('tmp'));
});
