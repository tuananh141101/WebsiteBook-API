const jsonServer = require("json-server");
const express = require("express");
const path = require("path");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

// Thêm middleware để cấu hình header 'Access-Control-Allow-Origin'
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

server.use(middlewares);
server.use("/public", express.static(path.join(__dirname, "public")));
// Add this before server.use(router)
server.use(
  jsonServer.rewriter({
    "/api/*": "/$1",
    "/blog/:resource/:id/show": "/:resource/:id",
  })
);

server.use((req, res, next) => {
  if (
    req.method === "GET" &&
    req.path === "/products" &&
    req.query.category
  ) {
    const rawCat = req.query.category as string;

    // Gỡ bỏ category khỏi query để tránh xung đột với json-server router
    delete req.query.category;

    const categoryFilter = rawCat.split(",");
    const allProducts = router.db.get("products").value();

    const filtered = allProducts.filter((product) =>
      Array.isArray(product.category) &&
      categoryFilter.some((cat) => product.category.includes(cat))
    );

    return res.jsonp(filtered);
  }
  next();
});

// Serve homepage with links to all APIs
server.get("/", (req, res) => {
  const resources = Object.keys(router.db.__wrapped__);
  const links = resources.map(
    (resource) => `<li><a href="/${resource}">${resource}</a></li>`
  );
  res.send(`<h1>APIs:</h1><ul>${links.join("")}</ul>`);
});

server.use(router);
server.listen(process.env.PORT || 3000, () => {
  console.log("JSON Server is running");
});

// Export the Server API
module.exports = server;
