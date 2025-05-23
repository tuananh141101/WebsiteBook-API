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
}));
server.use(function (req, res, next) {
  try {
    // Middleware lọc theo category (nhiều giá trị, cách nhau bởi dấu phẩy)
    if (req.method === "GET" && req.path === "/products" && req.query.category) {
      var rawCat = req.query.category;
      delete req.query.category; // Xóa khỏi query gốc để tránh json-server xử lý thêm

      var categoryFilter = typeof rawCat === "string" ? rawCat.split(",") : [];
      var allProducts = router.db.get("products").value();
      var filtered = allProducts.filter(function (product) {
        return Array.isArray(product.categories) && categoryFilter.some(function (cat) {
          return product.categories.includes(cat);
        });
      });
      return res.jsonp(filtered);
    }

    next();
  } catch (error) {
    console.error("Middleware error:", error);
    res.status(500).jsonp({
      error: "Internal Server Error in category filter."
    });
  }
}); // Serve homepage with links to all APIs

server.get("/", function (req, res) {
  var resources = Object.keys(router.db.__wrapped__);
  var links = resources.map(function (resource) {
    return "<li><a href=\"/".concat(resource, "\">").concat(resource, "</a></li>");
  });
  res.send("<h1>APIs:</h1><ul>".concat(links.join(""), "</ul>"));
});
server.use(router);
server.listen(process.env.PORT || 3000, function () {
  console.log("JSON Server is running");
}); // Export the Server API

module.exports = server;