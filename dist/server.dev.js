"use strict";

var jsonServer = require("json-server");

var express = require("express");

var path = require("path");

var server = jsonServer.create();
var router = jsonServer.router("db.json");
var middlewares = jsonServer.defaults();

var dynamicFilterMiddleware = require('./middlewares/dynamicFilter'); // Thêm middleware để cấu hình header 'Access-Control-Allow-Origin'


server.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
server.use(middlewares);
server.use(dynamicFilterMiddleware(router));
server.use("/public", express["static"](path.join(__dirname, "public"))); // Add this before server.use(router)

server.use(jsonServer.rewriter({
  "/api/*": "/$1",
  "/blog/:resource/:id/show": "/:resource/:id"
})); // Serve homepage with links to all APIs

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