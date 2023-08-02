const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        unique: true
    },
    order_id: {
        type: Number,
        required: true,
        unique: true
    },
    amount: {
        type: String,
        required: true
    },
    x_amount: {
        type: String,
        required: true,
        default: 0
    },
    client: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "clients"
    },
    coin: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "coins"
    },
    tx_id: {
        type: String
    },
    verified_at: {
        type: Date
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {versionKey: false });

const Deposit = mongoose.model('deposits', Schema);

module.exports = Deposit;