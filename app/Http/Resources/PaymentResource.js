module.exports = function (collection) {
    return JSON.parse(JSON.stringify(collection, [
            "_id",
            "client_id",
            "amount",
            "paid_at",
            "created_at",
        ]
    ));
}