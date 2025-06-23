"use strict";

var _require = require("../server"),
    search = _require.search;

var dynamicFilterMiddleware = function dynamicFilterMiddleware(router) {
  return function (req, res, next) {
    if (req.method === "GET" && req.path === "/products") {
      try {
        var currentFilteredData = router.db.get("products").value(); // --- Search toàn cục ---

        if (req.query.search) {
          var keyword = req.query.search.toLowerCase();
          delete req.query.search;
          console.log("🚀 ~ keyword:", keyword); // const matchData = () => {
          //     const nameMatch = currentFilteredData.filter(product => {
          //         return keyword.toLowerCase().includes(product.name.toLowerCase())
          //     });
          //     const authorMatch = currentFilteredData.author.toLowerCase().includes(keyword.toLowerCase());
          //     const categoriesMatch = Array.isArray(currentFilteredData.categories) ? currentFilteredData.categories.some(cat => cat.toLowerCase().includes(keyword))
          //     : false;
          //     return nameMatch || authorMatch || categoriesMatch;
          // }
          // currentFilteredData = matchData();

          currentFilteredData = currentFilteredData.filter(function (product) {
            var nameMatch = product;
          });
        } // --- Lọc theo Category ---


        if (req.query.category) {
          var rawCat = req.query.category;
          delete req.query.category;
          var categoryFilter = typeof rawCat === "string" ? rawCat.split(",").map(function (c) {
            return c.trim().toLowerCase();
          }) : [];
          var filteredByCategory = currentFilteredData.filter(function (product) {
            if (!Array.isArray(product.categories) || product.categories.length === 0) {
              return false;
            }

            return product.categories.some(function (productCategoryName) {
              var normalizedProductCategory = productCategoryName.toLowerCase();
              return categoryFilter.includes(normalizedProductCategory);
            });
          });
          currentFilteredData = filteredByCategory;
        } // --- Lọc theo Author ---


        if (req.query.author) {
          var rawAuthor = req.query.author;
          delete req.query.author;
          var authorFilter = typeof rawAuthor === "string" ? rawAuthor.split(",").map(function (a) {
            return a.trim().toLowerCase();
          }) : [];
          var filteredByAuthor = currentFilteredData.filter(function (product) {
            if (!product.author || typeof product.author !== 'string') {
              return false;
            }

            var normalizedProductAuthor = product.author.toLowerCase();
            return authorFilter.includes(normalizedProductAuthor);
          });
          currentFilteredData = filteredByAuthor;
        } // --- Lọc theo Price ---


        if (req.query.minPrice || req.query.maxPrice) {
          var min = parseFloat(req.query.minPrice);
          var max = parseFloat(req.query.maxPrice);
          delete req.query.minPrice;
          delete req.query.maxPrice;
          var minPrice = -Infinity;
          var maxPrice = Infinity;
          if (!isNaN(min)) minPrice = min;
          if (!isNaN(max)) maxPrice = max;
          var filteredPrice = currentFilteredData.filter(function (p) {
            var price = parseFloat(p.price);
            return price && price >= minPrice && price <= maxPrice;
          });
          currentFilteredData = filteredPrice;
        }

        req.filteredData = currentFilteredData;
        next();
      } catch (error) {
        console.error("Dynamic Filter Middleware ERROR:", error);
        res.status(500).jsonp({
          error: "Internal Server Error in dynamic filter."
        });
      }
    } else {
      next();
    }
  };
};

module.exports = dynamicFilterMiddleware;