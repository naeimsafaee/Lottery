const _ = require('lodash');

module.exports = function (collection) {


    return JSON.parse(JSON.stringify(collection, [
            "client_id",
            "lottery_id",
            "numbers",
            "jokers",
            "created_at",
        ]
    ));

    var keyMap =  {
        "name" : "lottery_id" , "to" : "lottery"
    };

      /*  "_id": 'value',
        "client_id": 'value',
        "lottery_id": 'value',
        "payment_id": 'value',
        "numbers": 'value',
        "jokers": 'value',
        "has_paid": 'value',
        "created_at": 'value'*/

    const set = (obj, path, val) => {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const lastObj = keys.reduce((obj, key) =>
                obj[key] = obj[key] || {},
            obj);
        lastObj[lastKey] = val;

        return obj;
    };

    var result = collection.map(function(item , i) {

        const arr = {};
        set(arr,  keyMap.to,  item[keyMap.name]);

        item.ygtfd = "arr";

        return item;
    })

    return result;

}