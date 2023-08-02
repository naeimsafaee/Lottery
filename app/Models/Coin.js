const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true,
        get: (image) => {
            return image ? process.env.APP_URL + image : null;
        }
    },
    symbol: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false,
    toJSON: {getters: true, setters: true},
    toObject: {getters: true, setters: true},

});

const Coin = mongoose.model('coins', Schema);

module.exports = Coin;