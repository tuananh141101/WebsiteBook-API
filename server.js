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

// --- 1. Middleware lọc theo Category ---
server.use((req, res, next) => {
  try {
    if (req.method === "GET" && req.path === "/products" && req.query.category) {
      const rawCat = req.query.category;
      delete req.query.category;

      const categoryFilter = typeof rawCat === "string" ? rawCat.split(",").map(c => c.trim().toLowerCase()) : [];
      const allProducts = router.db.get("products").value();

      const filteredByCategory = allProducts.filter(product => {
          if (!Array.isArray(product.categories) || product.categories.length === 0) {
            return false;
          }

          let foundMatchForProduct = false; // Biến cờ để theo dõi có khớp hay không

          product.categories.forEach(productCategoryName => {
            const normalizedProductCategory = productCategoryName.toLowerCase();
            // Kiểm tra xem category đã chuẩn hóa của sản phẩm có tồn tại
            // trong mảng categoryFilter (đã chuẩn hóa) không
            const isIncludedInFilter = categoryFilter.includes(normalizedProductCategory);

            if (isIncludedInFilter) {
              foundMatchForProduct = true; // Đánh dấu là tìm thấy khớp
              console.log(`  MATCH! Product Category '${normalizedProductCategory}' is in filter.`);
            } else {
              console.log(`  NO MATCH. Product Category '${normalizedProductCategory}' is not in filter.`);
            }
          });

          if (!foundMatchForProduct) {
            console.log(`  Product ID ${product.id}: REJECTED by Category Filter (no overall match).`);
          } else {
            console.log(`  Product ID ${product.id}: PASSED Category Filter (found at least one match).`);
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
    res.status(500).jsonp({ error: "Internal Server Error in category filter." });
  }
});


// --- 2. Middlewrae lọc theo Author ---


// Serve homepage with links to all APIs
server.get("/", (req, res) => {
  const resources = Object.keys(router.db.__wrapped__);
  const links = resources.map(
    (resource) => `<li><a href="/${resource}">${resource}</a></li>`
  );
  res.send(`<h1>APIs:</h1><ul>${links.join("")}</ul>`);
});

router.render = (req, res) => {
    // ... logic router.render như đã trình bày ở trên ...
    if (req.path === '/products' && req.filteredData !== undefined) {
      return res.jsonp(req.filteredData);
    }
    res.jsonp(res.locals.data);
};

server.use(router);
server.listen(process.env.PORT || 3000, () => {
  console.log("JSON Server is running");
});

// Export the Server API
module.exports = server;