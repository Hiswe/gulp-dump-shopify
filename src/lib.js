// http://mammal.io/articles/using-es6-today/

import * as utils from './utils';
import * as transform from './to-shopify-object';

import async    from 'async';
import es       from 'event-stream';
import through  from 'through2';

let options;
let shopify;
let pages         = {};
let products      = {};
let collections   = {};


function dumpShopify(file, encoding, cb) {

  // don't call the api without the right informations
  if (!utils.checkOptions(options, this)) return cb();

  // initialize some utils
  let req         = utils.request(options);
  let log         = utils.logger(options);
  let createFile  = utils.createFile.bind(this);
  let context     = this;
  let that        = this;

  // make some controls
  // - should be useless because the source file is provided…
  if (file.isNull()) {
    cb(null, file);
    return;
  }
  if (file.isBuffer()) {
    this.emit('error', utils.error('Buffers not supported!'));
    return cb();
  }

  // All api calls are listed in src/shopify-api-calls.list
  let apiCalls = [];
  file.contents
    .pipe(es.split())
    .pipe(es.through(writeApiCall, makeFirstApiCalls));

  function writeApiCall(data) {
    // don't take care of empty lines
    // comments lines are prefixed with a ;
    if (data === '' || /^;/.test(data)) return;
    apiCalls.push(data);
  }

  function makeFirstApiCalls() {
    log('make first api calls');
    async.map(apiCalls, req, treatFirstApiCalls);
  }

  // Dump first calls
  //    We need to process some datas in order to be closer to Shopify Objects
  //    This will also help us to gather more dats
  function treatFirstApiCalls(err, results) {
    log('treat first api calls');
    if (err) return cb(err);

    shopify = {};
    results = results.map( result => result.body);

    // create JSON files for api responses
    results.forEach( function (result, i) {
      // gather every thing related to collection in the same place
      if (/collect/.test(apiCalls[i])) {
        return createFile(apiCalls[i], result,  './collections/');
      };
      return createFile(apiCalls[i], result);
    });

    // begin to build all datas file.
    for (let result of results) {
      shopify = Object.assign(shopify, JSON.parse(result));
    }

    // - products
    //   don't write the file now as we need also metafields
    //   would be fetched in the second rows of API calls
    products = transform.products(shopify);

    // - collections
    //   all product reference will be made by product id
    //   this will prevent to have circular references in the JSON
    //   and also to have a gigantic JSON at the end
    //   process should be made in JS
    //   just before feeiding those datas to a template engine
    collections = transform.collections(shopify);

    log('gather second rows of api call');

    let moreRequests      = {};
    // - settings
    let currentTheme  = shopify.themes.find( theme => theme.role === 'main' );
    let id            = currentTheme.id;
    moreRequests.settings = `themes/${currentTheme.id}/assets.json?asset[key]=config/settings_data`;
    // - pages
    shopify.pages.forEach(page => moreRequests[`page-${page.handle}`] = `pages/${page.id}`);
    // - articles
    let blogs  = {};
    shopify.blogs.forEach(function(blog) {
      blogs[blog.handle]          = blog;
      moreRequests[`blog-${blog.handle}`] = `blogs/${blog.id}/articles`;
    });
    // - products metafields
    for (let productId in products) {
      moreRequests[`meta-${productId}`] = `products/${productId}/metafields`;
    }

    console.log(moreRequests);

    return cb(null);
  }
}

function createConsolidateDatas(cb) {
  return cb();

  let that = this;

  // JSON can be very large
  // JSON.stringify have a limit
  // -> split the datas in different files in order to avoid size limit
  // -> OR remove unused content
  delete shopify.themes;
  delete shopify.collects;
  delete shopify.smart_collections;
  delete shopify.custom_collections;
  delete shopify.products;

  that.push(createFile('mockup-shopify', shopify));
  that.push(createFile('mockup-products', products));
  that.push(createFile('mockup-collections', collections));
  cb();
}

function dumpify(opts) {
  options = Object.assign({}, utils.config, opts);
  return through.obj(dumpShopify, createConsolidateDatas);
}

export {dumpify as default}
