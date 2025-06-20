const dynamicFilterMiddleware = (router) => (req, res, next) => {
    if (req.method === "GET" && req.path === "/products") {
        try {
            let currentFilteredData = router.db.get("products").value();

            // --- Lọc theo Category ---
            if (req.query.category) {
                const rawCat = req.query.category;
                delete req.query.category; 

                const categoryFilter = typeof rawCat === "string" ? rawCat.split(",").map(c => c.trim().toLowerCase()) : [];
                const filteredByCategory = currentFilteredData.filter(product => {
                    if (!Array.isArray(product.categories) || product.categories.length === 0) {
                        return false;
                    }
                    return product.categories.some(productCategoryName => {
                        const normalizedProductCategory = productCategoryName.toLowerCase();
                        return categoryFilter.includes(normalizedProductCategory);
                    });
                });
                currentFilteredData = filteredByCategory; 
            }

            // --- Lọc theo Author ---
            if (req.query.author) {
                const rawAuthor = req.query.author;
                delete req.query.author; 

                const authorFilter = typeof rawAuthor === "string" ? rawAuthor.split(",").map(a => a.trim().toLowerCase()) : [];
                const filteredByAuthor = currentFilteredData.filter(product => {
                    if (!product.author || typeof product.author !== 'string') {
                        return false;
                    }
                    const normalizedProductAuthor = product.author.toLowerCase();
                    return authorFilter.includes(normalizedProductAuthor);
                });
                currentFilteredData = filteredByAuthor;
            }

            // --- Lọc theo Price ---
            if (req.query.minPrice || req.query.maxPrice) {
                const min = parseFloat(req.query.minPrice);
                const max = parseFloat(req.query.maxPrice);

                delete req.query.minPrice;
                delete req.query.maxPrice;

                // const minPrice = !Number.isNaN(min) ? min : -Infinity;
                // const maxPrice = !Number.isNaN(max) ? max : Infinity;
                if (!isNaN(minParsed)) {
                    minPrice = minParsed;
                }
                if (!isNaN(maxParsed)) {
                    maxPrice = maxParsed;
                }

                const filteredPrice = currentFilteredData.filter(p => {
                    const price = parseFloat(p.price);
                    return !Number.isNaN(price) && price >= minPrice && price <= maxPrice;
                });
                currentFilteredData = filteredPrice;
            }

            req.filteredData = currentFilteredData;
            next(); // Chuyển yêu cầu đến middleware tiếp theo
        } catch (error) {
            console.error("Dynamic Filter Middleware ERROR:", error);
            res.status(500).jsonp({ error: "Internal Server Error in dynamic filter." });
        }
    } else {
        next();
    }
};

module.exports = dynamicFilterMiddleware;