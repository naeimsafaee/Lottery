const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    answer: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {versionKey: false});

const Support = mongoose.model('supports', Schema);

module.exports = Support;