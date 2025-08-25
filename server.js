const jsonServer = require("json-server");
const express = require("express");
const path = require("path");
const auth = require("json-server-auth");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();
const addDefaultUserFields = require('./middlewares/addDefaultUserFields');
const dynamicFilterMiddleware = require('./middlewares/dynamicFilter');
const dynamicSort = require('./middlewares/dynamicSort');
const paginationMiddleware = require('./middlewares/paginationMiddle');
const finalResponseMiddleware = require("./middlewares/finalResponseMiddle");

server.db = router.db;

// Thêm middleware để cấu hình header 'Access-Control-Allow-Origin'
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

server.use(middlewares);
server.use(dynamicFilterMiddleware(router));
server.use(dynamicSort(router));
server.use(paginationMiddleware);
server.use(finalResponseMiddleware);
server.use("/public", express.static(path.join(__dirname, "public")));
// Add this before server.use(router)
server.use(
  jsonServer.rewriter({
    "/api/*": "/$1",
    "/blog/:resource/:id/show": "/:resource/:id",
  })
);

// Serve homepage with links to all APIs
server.get("/", (req, res) => {
  const resources = Object.keys(router.db.__wrapped__);
  const links = resources.map(
    (resource) => `<li><a href="/${resource}">${resource}</a></li>`
  );
  res.send(`<h1>APIs:</h1><ul>${links.join("")}</ul>`);
});

server.use(addDefaultUserFields);
server.use(auth);  
server.use(router);
server.listen(process.env.PORT || 3000, () => {
  console.log("JSON Server is running");
});

// Export the Server API
module.exports = server;