"use strict";

var finalResponseMiddleware = function finalResponseMiddleware(req, res, next) {
  if (req.method === "GET" && req.path === "/products") {
    if (req.finalData) {
      return res.status(200).json({
        data: req.finalData,
        pagination: req.paginationInfo || null
      });
    }

    if (req.filteredData) {
      return res.status(200).json(req.filteredData);
    }
  }

  next();
};

module.exports = finalResponseMiddleware;