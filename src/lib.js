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
let blogs         = {};

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
  //    This will also help us to gather more datas
  function treatFirstApiCalls(err, results) {
    log('treat first api calls');
    if (err) return cb(err);

    shopify = {};
    results = results.map( result => result.body);


    if (options.debug) {
      // create JSON files for api responses
      results.forEach( function (result, i) {
        if (/collect/.test(apiCalls[i])) {
          return createFile(apiCalls[i], result,  './collections/');
        };
        return createFile(apiCalls[i], result);
      });
    }

    // begin to build all datas file.
    for (let result of results) {
      shopify = Object.assign(shopify, JSON.parse(result));
    }

    // - products
    products = transform.products(shopify);

    // - collections
    //   all product reference will be made by product id
    //   this will prevent to have circular references in the JSON
    //   and also to have a gigantic JSON at the end
    //   process should be made in JS
    //   just before feeiding those datas to a template engine
    collections = transform.collections(shopify, products);

    log('gather second rows of api call');

    let moreRequests      = {};
    // - settings
    //    use Array.find for babel-runtime to catch up…
    //    so we won't nee babel-polyfill
    let currentTheme  = Array.find(shopify.themes, theme => theme.role === 'main');
    let id            = currentTheme.id;
    moreRequests.settings = `themes/${currentTheme.id}/assets.json?asset[key]=config/settings_data`;
    // - pages
    shopify.pages.forEach(page => moreRequests[`page-${page.handle}`] = `pages/${page.id}`);
    // - articles
    shopify.blogs.forEach(function(blog) {
      blogs[blog.handle]          = blog;
      moreRequests[`blog-${blog.handle}`] = `blogs/${blog.id}/articles`;
    });
    // - products metafields
    for (let productId in products) {
      moreRequests[`meta-${productId}`] = `products/${productId}/metafields`;
    }

    log('make & treat second api calls');

    async.forEachOf(moreRequests, secondRowRequest, onDone);
  }

  function secondRowRequest(url, key, callback) {
    return req(url, function(err, response) {
      if (err) return callback(err);

      var result = JSON.parse(response.body);
      // settings
      if (key === 'settings') {
        let settings  = result.asset.value;
        settings      = {
          settings: JSON.parse(settings).current
        };
        shopify       = Object.assign(shopify, settings);
        if (options.debug) createFile('settings', settings);
      }
      // pages
      if (/^page-/.test(key)) {
        key =         key.replace('page-', '');
        let page      = Object.assign({}, result.page);
        page.content  = page.body_html;
        if (options.debug) createFile(key, page, './page/');
        pages[key] = page;
      }
      // articles
      if (/^blog-/.test(key)) {
        let blogHandle  = key.replace('blog-', '');
        let articles    = result.articles.map(function (article) {
          article         = Object.assign({}, article);
          article.tags    = article.tags.split(', ');
          article.content = article.body_html;
          article.excerpt = article.summary_html;
          ['body_html', 'summary_html'].forEach( key => delete article[key])
          return article;
        });
        blogs[blogHandle].articles = articles;
        if (options.debug) createFile(blogHandle, result, './blog/');
      }
      // metafields
      if (/^meta-/.test(key)) {
        let productId   = key.replace(/^meta-/, '')
        let metafields  = result.metafields;
        if (!metafields.length) return callback(null);
        let meta         = {};
        for (let m of metafields) {
          meta[m.namespace]         = meta[m.namespace] || {};
          meta[m.namespace][m.key]  = m.value;
        }
        products[productId].metafields = meta;
      }
      callback(null);
    });
  }

  function onDone(err, results) {
    if (err) return cb(err);
    return cb(null);
  }
}

function createConsolidateDatas(cb) {
  let createFile  = utils.createFile.bind(this);

  // JSON can be very large
  // beware JSON.stringify have a limit
  // -> split the datas in different files in order to avoid size limit
  // -> OR remove unused content

  delete shopify.themes;
  delete shopify.collects;
  delete shopify.smart_collections;
  delete shopify.custom_collections;

  if (options.debug) {
    delete shopify.products;
    delete shopify.collections;
    createFile('mockup-products', products);
    createFile('mockup-collections', collections);
  } else {
    shopify.products    = products;
    shopify.collections = collections;
  }
  createFile('mockup-shopify', shopify);
  return cb();
}

function dumpify(opts) {
  options = Object.assign({}, utils.config, opts);
  return through.obj(dumpShopify, createConsolidateDatas);
}

export {dumpify as default}
