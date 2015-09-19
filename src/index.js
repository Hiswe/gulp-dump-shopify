import fs      from 'fs';
import path    from 'path';
import source  from 'vinyl-source-stream';
import dumpify from './lib';

function init(options) {
  return fs
    .createReadStream(path.join(__dirname , './shopify-api-calls.list'))
    .pipe(source('shopify-api-calls.list'))
    .pipe(dumpify(options));
}

export {init as default}
