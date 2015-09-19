'use strict';

import del from 'del';
// const del           = require('del');
const rc            = require('rc')('gds');

const gulp          = require('gulp');
const gutil         = require('gulp-util');
const babel         = require('gulp-babel');
const jsbeautifier  = require('gulp-jsbeautifier');

import dumpify from './src/index';

gulp.task('compile', function () {
  return gulp.src('src/index')
    .pipe(babel())
    .pipe(gulp.dest('dist'))
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
    verbose:  true,
  })
  // better to have a nice indentation
  .pipe(jsbeautifier({
    indentSize: 2,
    logSuccess: false
  }))
  .pipe(gulp.dest('tmp'));
});
