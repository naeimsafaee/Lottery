module.exports = function (collection) {
    return JSON.parse(JSON.stringify(collection, [
            "_id",
            "name",
            "draw_price",
            "total_jackpot",
            "dollar_jackpot",
            "start_date",
            "end_date",
            "days_left",
            "created_at",
        ]
    ));
}