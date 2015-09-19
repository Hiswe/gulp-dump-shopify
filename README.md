# Gulp dump shopify

The purpose of this plugin is to grab some datas from [Shopify API](https://docs.shopify.com/api) and to consolidate them in a single JSON file.

Also this file will try to match as much as possible [Shopify's Objects](https://docs.shopify.com/themes/liquid-documentation/objects)

The main use case should be to render a static integration with some datas similar to Shopify's one.

## Install

```
npm install gulp-dump-shopify --save-dev
```

## Use

You will need some credentials from Shopify (see [creating-a-private-app](https://docs.shopify.com/api/authentication/creating-a-private-app))

```js
var gulp        = require('gulp');
var dumpShopify = require('gulp-dump-shopify');

gulp.task('dump', function () {
  return dumpShopify({
      domain: 'https://your-domain.myshopify.com',
      apikey: '32characterswithnumbersandletter',
      password: '32characterswithnumbersandletter',
    })
    .pipe(gulp.dest('dump'));
});
```

### Additional options

*gulp-dump-shopify* can take a `debug` option. If set to `true`, it will also write all results from api calls, and split the dump file in a general, collections & products files.

### Handle collections & products references

To avoid circular references in JSON, all references of products and collections are only made with *ids*.  

You should replace them with “real” products/collections in order to be closer of Shopify's Object.

```js
var shopify     = require('dump/mockup-shopify.json');
var collections = shopify.collections;
var products    = shopify.products;

// reference products in collections
function getProduct(productId) {
  return products[productId];
}
for (let collectionName in collections) {
  let coll = collections[collectionName];
  coll.products = coll.products.map(getProduct);
}

// reference collections in products
function getCollection(collectionId) {
  return collections[collectionId];
}
for (let productId in products) {
  let prod = products[productId];
  prod.collections = prod.collections.map(getCollection);
}

// feed those datas to some templates
// …

```
