const dynamicFilterMiddleware = (router) => (req, res, next) => {
    if (req.method === "GET" && req.path === "/products") {
        try {
            let currentFilteredData = router.db.get("products").value();
            
            // --- Search toàn cục ---
            if (req.query.search) {
                const keyword = req.query.search.toLowerCase();
                delete req.query.search;

                currentFilteredData = currentFilteredData.filter(product => {
                    const nameMatch = product.name?.toLowerCase().includes(keyword);
                    const authorMatch = product.author?.toLowerCase().includes(keyword);
                    const categoriesMatch = Array.isArray(product.categories) ? product.categories.some(cat => cat.toLowerCase().includes(keyword)) : false;

                    return nameMatch || authorMatch || categoriesMatch;
                })
            } 

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
                
                let minPrice = -Infinity;
                let maxPrice = Infinity;

                if (!isNaN(min)) minPrice = min;
                if (!isNaN(max)) maxPrice = max;

                const filteredPrice = currentFilteredData.filter(p => {
                    const price = parseFloat(p.price);
                    return price && price >= minPrice && price <= maxPrice;
                });
                currentFilteredData = filteredPrice;
            }

            req.filteredData = currentFilteredData;
            next();
        } catch (error) {
            console.error("Dynamic Filter Middleware ERROR:", error);
            res.status(500).jsonp({ error: "Internal Server Error in dynamic filter." });
        }
    } else {
        next();
    }
};

module.exports = dynamicFilterMiddleware;