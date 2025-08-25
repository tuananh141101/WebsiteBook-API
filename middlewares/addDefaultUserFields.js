const addDefaultUserFields = (req, res, next) => {
    if (req.method === "POST" && req.path === "/register") {
        const originJSON = res.json;

        res.json = function (data) {
            const modifieldData = {
                ...data,
                wishlist: data.wishlist || [],
                cart: data.cart || []
            };

            return originJSON.call(this, modifieldData)
        }
    }
    next();
}

module.exports = addDefaultUserFields;