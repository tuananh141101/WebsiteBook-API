const dynamicFilterMiddleware = (router) => (req, res, next) => {
    if (req.method === "GET" && req.path === "/products") {
        try {
            let currentFilteredData = router.db.get("products").value();
            console.log("\n--- Dynamic Filter Middleware DEBUG START ---");
            console.log(`1. Initial products count: ${currentFilteredData.length}`);
            console.log("2. Checking for query parameters...");

            // --- Lọc theo Category ---
            if (req.query.category) {
                const rawCat = req.query.category;
                delete req.query.category; 

                const categoryFilter = typeof rawCat === "string" ? rawCat.split(",").map(c => c.trim().toLowerCase()) : [];
                console.log(`   - Applying Category Filter: [${categoryFilter.join(', ')}]`);

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
                console.log(`     Category Filtered Count: ${currentFilteredData.length}`);
            }

            // --- Lọc theo Author ---
            if (req.query.author) {
                const rawAuthor = req.query.author;
                delete req.query.author; 

                const authorFilter = typeof rawAuthor === "string" ? rawAuthor.split(",").map(a => a.trim().toLowerCase()) : [];
                console.log(`   - Applying Author Filter: [${authorFilter.join(', ')}]`);

                const filteredByAuthor = currentFilteredData.filter(product => {
                    if (!product.author || typeof product.author !== 'string') {
                        return false;
                    }
                    const normalizedProductAuthor = product.author.toLowerCase();
                    return authorFilter.includes(normalizedProductAuthor);
                });
                currentFilteredData = filteredByAuthor;
                console.log(`     Author Filtered Count: ${currentFilteredData.length}`);
            }

            // --- THÊM CÁC BỘ LỌC KHÁC TẠI ĐÂY (Ví dụ: Price, Pages, Yearpublished) ---
            // Ví dụ: Lọc theo Price (ví dụ: price=min-max hoặc price=exact)
            // if (req.query.price) {
            //     const rawPrice = req.query.price;
            //     delete req.query.price;

            //     // Xử lý giá trị price. Ví dụ: "10-20" hoặc "15"
            //     let minPrice = -Infinity;
            //     let maxPrice = Infinity;
            //     if (typeof rawPrice === 'string') {
            //         const priceParts = rawPrice.split('-').map(p => parseFloat(p.trim()));
            //         if (priceParts.length === 2 && !isNaN(priceParts[0]) && !isNaN(priceParts[1])) {
            //             minPrice = Math.min(priceParts[0], priceParts[1]);
            //             maxPrice = Math.max(priceParts[0], priceParts[1]);
            //         } else if (priceParts.length === 1 && !isNaN(priceParts[0])) {
            //             minPrice = priceParts[0];
            //             maxPrice = priceParts[0];
            //         }
            //     }
            //     console.log(`   - Applying Price Filter: min=${minPrice}, max=${maxPrice}`);

            //     const filteredByPrice = currentFilteredData.filter(product => {
            //         const productPrice = parseFloat(product.price); // Đảm bảo price trong data là số
            //         return !isNaN(productPrice) && productPrice >= minPrice && productPrice <= maxPrice;
            //     });
            //     currentFilteredData = filteredByPrice;
            //     console.log(`     Price Filtered Count: ${currentFilteredData.length}`);
            // }
            
            req.filteredData = currentFilteredData;
            console.log(`3. Final filtered count for /products: ${req.filteredData.length}`);
            console.log("--- Dynamic Filter Middleware DEBUG END ---\n");
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