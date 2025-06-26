"use strict";

var paginationMiddle = function paginationMiddle(req, res, next) {
  if (req.method === "GET" && req.path === "/products") {
    try {
      var data = req.filteredData || [];
      var totalItems = data.length;
      var page = parseInt(req.query._page) || 1;
      var limit = parseInt(req.query._limit) || totalItems;
      var start = (page - 1) * limit;
      var end = page * limit;
      var paginatedData = data.slice(start, end);
      var totalPages = Math.ceil(totalItems / limit);
      res.setHeader("X-Total-Count", totalItems);
      res.setHeader("X-Total-Pages", totalPages);
      res.setHeader("Access-Control-Expose-Headers", "X-Total-Count");
      req.paginationInfo = {
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: page,
        limit: limit
      };
      req.finalData = paginatedData;
      next();
    } catch (error) {
      console.error("Middleware Pagination ERROR: ", error);
      res.status(500).jsonp({
        error: "Internal Server Error in pagination."
      });
    }
  } else {
    next();
  }
};

module.exports = paginationMiddle;