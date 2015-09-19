import request from 'request';
import gutil from 'gulp-util';

const name    = 'gulp-dump-shopify';

function error(content) {
  return new gutil.PluginError(name, content);
}

const config  = {
  domain: false,
  apikey: false,
  password: false,
  verbose: false,
};

// logger
const prefix      = gutil.colors.cyan(name);
function logger(options) {
  if (!options.verbose) return function () {}
  return function log(...args) {
    gutil.log(prefix, ...args);
  }
}

// send an error if 1 of the crucial options are missing
function checkOptions(options, context) {
  if (!options.domain || !options.apikey || !options.password) {
    context.emit('error', error('domain, apikey && password are mandatory'));
    return false;
  }
  return true
}

// make an authentified request
function rq(options) {
  const domain      = options.domain;
  const auth        = {
    'auth': {
      'user': options.apikey,
      'pass': options.password,
    }
  };

  return function apiRequest(path, callback) {
    path = `${domain}/admin/${path}`;
    if (!/\.json^/.test) path = `${path}.json`;
    request( path, auth, callback);
  }
}

// create a new vinyl file and push it right away
function createFile(fileName, content, cwd = './' ) {
  fileName  = /\.json$/.test(fileName) ? fileName : fileName + '.json';
  content   = typeof content === 'string' ? content : JSON.stringify(content);
  this.push(new gutil.File({
    cwd:  cwd,
    base: './',
    path: cwd === './' ? fileName : cwd + fileName,
    contents: new Buffer(content)
  }));
}

export {name, config, rq as request, checkOptions, error, logger, createFile};
