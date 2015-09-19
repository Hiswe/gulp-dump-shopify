'use strict';

import del            from 'del';
import gulp           from 'gulp';
import gutil          from 'gulp-util';
import babel          from 'gulp-babel';
import jsbeautifier   from 'gulp-jsbeautifier';
import merge          from 'merge-stream';
import dumpify        from './src/index';

const rc            = require('rc')('gds');
const argv          = require('yargs').argv;

gulp.task('build', function () {

  var jsFiles = gulp
    .src('src/*.js')
    .pipe(babel({ optional: ['runtime'] }))
    .pipe(gulp.dest('dist'));

  var listFiles = gulp
    .src('src/*.list');

  return merge(jsFiles, listFiles)
    .pipe(gulp.dest('dist'));
});

// test dump task
gulp.task('clean', function (cb) {
  return del(['tmp'], cb);
});

gulp.task('dump', ['clean'], function () {
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
