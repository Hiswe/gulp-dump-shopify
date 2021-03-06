import request from 'request';
import Vinyl from 'vinyl';
import c from 'ansi-colors';
import fancyLog from 'fancy-log';
import PluginError from 'plugin-error';

const name = 'gulp-dump-shopify';

function error(content) {
  return new PluginError(name, content);
}

const config = {
  domain: false,
  apikey: false,
  password: false,
  debug: false,
};

// logger
const prefix = c.cyan(name);
function logger(options) {
  if (!options.debug) return function() {};
  return function log(...args) {
    fancyLog(prefix, ...args);
  };
}

// send an error if 1 of the crucial options are missing
function checkOptions(options, context) {
  if (!options.domain || !options.apikey || !options.password) {
    context.emit('error', error('domain, apikey && password are mandatory'));
    return false;
  }
  return true;
}

// make an authentified request
function rq(options) {
  const domain = options.domain;
  const auth = {
    auth: {
      user: options.apikey,
      pass: options.password,
    },
  };

  return function apiRequest(path, callback) {
    path = `${domain}/admin/${path}`;
    if (!/\.json$/.test(path)) path = `${path}.json`;
    request(path, auth, callback);
  };
}

// create a new vinyl file and push it right away
function createFile(fileName, content, cwd = './') {
  fileName = /\.json$/.test(fileName) ? fileName : fileName + '.json';
  content = typeof content === 'string' ? content : JSON.stringify(content);
  this.push(
    new Vinyl({
      cwd: cwd,
      base: './',
      path: cwd === './' ? fileName : cwd + fileName,
      contents: new Buffer.from(content),
    })
  );
}

export { name, config, rq as request, checkOptions, error, logger, createFile };
