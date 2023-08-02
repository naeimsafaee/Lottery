const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    address: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
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
    email_confirm_link: {
        type: String
    },
    verified_at: {
        type: Date
    },
    pay_at: {
        type: Date
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {versionKey: false });

const Withdraw = mongoose.model('withdraws', Schema);

module.exports = Withdraw;