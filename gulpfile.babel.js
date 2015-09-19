'use strict';

import del            from 'del';
import gulp           from 'gulp';
import gutil          from 'gulp-util';
import babel          from 'gulp-babel';
import jsbeautifier   from 'gulp-jsbeautifier';
import dumpify        from './src/index';

const rc            = require('rc')('gds');

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
    debug:    true,
  })
  // better to have a nice indentation
  .pipe(jsbeautifier({
    indentSize: 2,
    logSuccess: false
  }))
  .pipe(gulp.dest('tmp'));
});
