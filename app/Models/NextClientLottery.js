const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    client: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "clients"
    },
    numbers: {
        type: [{
            type: Number,
            required: true,
            validate: {
                validator: function (value) {
                    return value <= 50;
                },
                message: props => `${props.value} must be less than or equal to 50!`
            }
        }],
        validate: {
            validator: function (value) {
                return value.length === 5;
            },
            message: props => `${props.value} must be five numbers!`
        }
    },
    jokers: {
        type: [{
            type: Number,
            required: true,
            validate: {
                validator: function (value) {
                    return value <= 12;
                },
                message: props => `${props.value} must be less than or equal to 12!`
            }
        }],
        validate: {
            validator: function (value) {
                return value.length === 2;
            },
            message: props => `${props.value} must be two numbers!`
        }
    },
    count: {
        type: Number,
    },
    min: {
        type: Number,
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {versionKey: false});

const NextClientLottery = mongoose.model('next_client_lotteries', Schema);

module.exports = NextClientLottery;