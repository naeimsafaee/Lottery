const mongoose = require('mongoose');
require('mongoose-double')(mongoose);

const SchemaTypes = mongoose.Schema.Types;

const Schema = new mongoose.Schema({
    lottery: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "lotteries"
    },
    prize: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "prizes"
    },
    amount: {
        type: Number,
        default: 0,
        required: true
    },
    count: {
        type: Number,
        default: 0,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false,
    toJSON: {getters: true, setters: true},
    toObject: {getters: true, setters: true}
});

const LotteryPrize = mongoose.model('lottery_prizes', Schema);

module.exports = LotteryPrize;