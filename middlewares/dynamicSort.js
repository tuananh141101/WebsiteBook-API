const dynamicSort = (router) => (req, res, next) => {
    if (req.method === "GET" && 
        req.path === "/products" || req.path.startsWith("/products?")) {
        try {
            const sortby = req.query.sortby;
            const order = req.query.order;
            let data =  req.filteredData || router.db.get("products").value();
            
            const allowedSortFields = ["name", "price"];
            const allowedOrders = ["asc", "desc"];

            if (!sortby) return next();

            if (!allowedOrders.includes(order)) {
                return res.status(400).json({
                error: `Invalid sort order. Use 'asc' or 'desc'.`
                });
            }
            if (!allowedSortFields.includes(sortby)) {
                return res.status(400).json({
                error: `Invalid sortBy field. Allowed values: ${allowedSortFields.join(", ")}.`
                });
            }

            if (sortby === 'name') {
                console.log("runnning in name")
                if (order === 'asc') {
                    data.sort((a, b) => a.name.localeCompare(b.name));
                    console.log("name asc")
                } else if (order === "desc") {
                    data.sort((a, b) => b.name.localeCompare(a.name));
                    console.log("name desc")
                }
            }
            if (sortby === 'price') {
                console.log("running in price")
                if (order === 'asc') {
                    data.sort((a, b) => a.price - b.price);
                    console.log("price asc")
                } else if (order === "desc") {
                    data.sort((a, b) => b.price - a.price);
                    console.log("price desc")
                }
            }

            req.filteredData = data;
            next();
        } catch (error) {
            console.error("Dynamic Sort Error:", error);
            res.status(500).jsonp({ error: "Internal Server Error in dynamic sort." });
        }
    } else {
        next();
    }
};

module.exports = dynamicSort;
