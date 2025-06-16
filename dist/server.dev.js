"use strict";

var jsonServer = require("json-server");

var express = require("express");

var path = require("path");

var server = jsonServer.create();
var router = jsonServer.router("db.json");
var middlewares = jsonServer.defaults(); // Thêm middleware để cấu hình header 'Access-Control-Allow-Origin'

server.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
server.use(middlewares);
server.use("/public", express["static"](path.join(__dirname, "public"))); // Add this before server.use(router)

server.use(jsonServer.rewriter({
  "/api/*": "/$1",
  "/blog/:resource/:id/show": "/:resource/:id"
})); // --- 1. Middleware lọc theo Category ---

server.use(function (req, res, next) {
  try {
    if (req.method === "GET" && req.path === "/products" && req.query.category) {
      var rawCat = req.query.category;
      delete req.query.category;
      var categoryFilter = typeof rawCat === "string" ? rawCat.split(",").map(function (c) {
        return c.trim().toLowerCase();
      }) : [];
      var allProducts = router.db.get("products").value();
      var filteredByCategory = allProducts.filter(function (product) {
        if (!Array.isArray(product.categories) || product.categories.length === 0) {
          return false;
        }

        var foundMatchForProduct = false; // Biến cờ để theo dõi có khớp hay không

        product.categories.forEach(function (productCategoryName) {
          var normalizedProductCategory = productCategoryName.toLowerCase(); // Kiểm tra xem category đã chuẩn hóa của sản phẩm có tồn tại
          // trong mảng categoryFilter (đã chuẩn hóa) không

          var isIncludedInFilter = categoryFilter.includes(normalizedProductCategory);

          if (isIncludedInFilter) {
            foundMatchForProduct = true; // Đánh dấu là tìm thấy khớp

            console.log("  MATCH! Product Category '".concat(normalizedProductCategory, "' is in filter."));
          } else {
            console.log("  NO MATCH. Product Category '".concat(normalizedProductCategory, "' is not in filter."));
          }
        });

        if (!foundMatchForProduct) {
          console.log("  Product ID ".concat(product.id, ": REJECTED by Category Filter (no overall match)."));
        } else {
          console.log("  Product ID ".concat(product.id, ": PASSED Category Filter (found at least one match)."));
        }

        return foundMatchForProduct;
      });
      req.filteredData = filteredByCategory;
      next();
    } else {
      console.log("Category Middleware: No category filter or not /products. Initializing req.filteredData with all products.");
      req.filteredData = router.db.get("products").value();
      next();
    }
  } catch (error) {
    console.error("Category Middleware ERROR:", error);
    res.status(500).jsonp({
      error: "Internal Server Error in category filter."
    });
  }
}); // --- 2. Middlewrae lọc theo Author ---
// Serve homepage with links to all APIs

server.get("/", function (req, res) {
  var resources = Object.keys(router.db.__wrapped__);
  var links = resources.map(function (resource) {
    return "<li><a href=\"/".concat(resource, "\">").concat(resource, "</a></li>");
  });
  res.send("<h1>APIs:</h1><ul>".concat(links.join(""), "</ul>"));
});

router.render = function (req, res) {
  // ... logic router.render như đã trình bày ở trên ...
  if (req.path === '/products' && req.filteredData !== undefined) {
    return res.jsonp(req.filteredData);
  }

  res.jsonp(res.locals.data);
};

server.use(router);
server.listen(process.env.PORT || 3000, function () {
  console.log("JSON Server is running");
}); // Export the Server API

module.exports = server;