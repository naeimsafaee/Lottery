const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    number: {
        type: Number,
        required: true
    },
    joker: {
        type: Number,
        required: true
    },
    prize: {
        type: Number,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {versionKey: false });

const Prize = mongoose.model('prizes', Schema);

module.exports = Prize;