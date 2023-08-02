const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    client: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "clients"
    },
    coin: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "coins"
    },
    address: {
        type: String,
        require: true,
    },
    verify_code: {
        type: String,
    },
    verified_at: {
        type: Date,
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {versionKey: false });

const Wallet = mongoose.model('wallets', Schema);

module.exports = Wallet;