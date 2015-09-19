//
// Those functions will transforms api calls results in shopify objects
//

function products(shopify) {
  var productsList = {};

  function toProduct(product) {
    var currentProduct              = Object.assign({}, product);
    currentProduct.tags             = currentProduct.tags.split(', ');
    currentProduct.price            = ~~currentProduct.variants[0].price;
    currentProduct.featured_image   = currentProduct.images.length ? currentProduct.images[0].src : null;
    currentProduct.type             = currentProduct.product_type;
    currentProduct.description      = currentProduct.body_html;
    currentProduct.collections      = [];
    ['product_type', 'body_html'].forEach( key => delete currentProduct[key]);
    // add collections ID
    shopify.collects
      .filter( collect => collect.product_id === currentProduct.id)
      .forEach( collect => currentProduct.collections.push(collect.collection_id));

    return product;
  }

  shopify.products.forEach(function (product) {
    productsList[product.id] = toProduct(product);
  });

  return productsList;
}

function collections(shopify, products) {

  // take care of the all collection
  var collectionsList =  {
      all: {
        products: []
      }
  };

  for (let id in products) {
    collectionsList.all.products.push(~~id);
  }

  // parse remaining collections

  function makeCollection(collection) {
    collection.products  = [];
    // add products ID
    shopify.collects
      .filter( collect => collect.collection_id === collection.id)
      .forEach( collect => collection.products.push(collect.product_id));

    collectionsList[collection.handle]  = collection;
    collectionsList[collection.id]      = collection;
  }

  shopify.smart_collections.forEach(makeCollection);
  shopify.custom_collections.forEach(makeCollection);

  return collectionsList;
}


export {products, collections};
