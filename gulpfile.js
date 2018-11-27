'use strict';

// use a regular es5 gulpfile
//  -> so we can really test what is using a Babel compiled module

var del = require('del');
var gulp = require('gulp');
var babel = require('gulp-babel');
var jsbeautifier = require('gulp-jsbeautifier');
var merge = require('merge-stream');
var rc = require('rc')('gds');
var argv = require('yargs').argv;

function cleanBuild(cb) {
  return del(['dist'], cb);
}

gulp.task('clean-build', cleanBuild);

function buildJs() {
  var jsBabel = gulp.src('src/*.js').pipe(
    babel({
      presets: ['@babel/env'],
    })
  );
  var listFiles = gulp.src('src/*.list');
  return merge(jsBabel, listFiles).pipe(gulp.dest('dist'));
}

const build = gulp.series(cleanBuild, buildJs);

gulp.task('build', build);

// test dump task
function cleanDump(cb) {
  return del(['tmp'], cb);
}

gulp.task('clean-dump', cleanDump);

function dumpify() {
  var dumpify = require('./dist/index');
  return (
    dumpify({
      domain: rc.domain,
      apikey: rc.apikey,
      password: rc.password,
      debug: argv.debug != null,
    })
      // better to have a nice indentation
      .pipe(
        jsbeautifier({
          indentSize: 2,
          logSuccess: false,
        })
      )
      .pipe(gulp.dest('tmp'))
  );
}

const dump = gulp.series(cleanDump, dumpify);

gulp.task('dump', dump);
