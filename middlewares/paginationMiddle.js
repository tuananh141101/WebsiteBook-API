const paginationMiddle = (req, res, next) => {
    if (req.method === "GET" && req.path === "/products") {
        try {
            const data = req.filteredData || [];
            const totalItems = data.length;

            const page = parseInt(req.query._page) || 1;
            const limit = parseInt(req.query._limit) || totalItems;

            const start = (page-1) * limit;
            const end = page * limit;

            const paginatedData = data.slice(start,end);
            const totalPages = Math.ceil(totalItems / limit);

            res.setHeader("X-Total-Count", totalItems);
            res.setHeader("X-Total-Pages", totalPages);
            res.setHeader("Access-Control-Expose-Headers", "X-Total-Count");

            req.paginationInfo = {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            };
            req.finalData = paginatedData;
            next();
        } catch (error) {
            console.error("Middleware Pagination ERROR: ",error);
            res.status(500).jsonp({ error: "Internal Server Error in pagination." });
        }
    } else {
        next();
    }
}

module.exports = paginationMiddle;