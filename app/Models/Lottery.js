const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: {
        type: String
    },
    draw_price: {
        type: Number,
        required: true
    },
    total_jackpot: {
        type: Number,
        default: 0,
        get: (prize) => {
            return prize * 80 / 100;
        }
    },
    start_date: {
        type: Date,
        required: true
    },
    days_left: {
        type: Number,
        default: 7,
    },
    end_date: {
        type: Date,
        required: true
    },
    has_ended: {
        type: Boolean,
        default: false,
    },
    have_to_run: {
        type: Boolean,
        default: false,
    },
    numbers: {
        type: [{
            type: Number,
           /* validate: {
                validator: function (value) {
                    return value <= 50;
                },
                message: props => `${props.value} must be less than or equal to 50!`
            }*/
        }],
        /*validate: {
            validator: function (value) {
                return value.length === 5;
            },
            message: props => `${props.value} must be five numbers!`
        }*/
    },
    jokers: {
        type: [{
            type: Number,
            /*validate: {
                validator: function (value) {
                    return value <= 12;
                },
                message: props => `${props.value} must be less than or equal to 12!`
            }*/
        }],
        /*validate: {
            validator: function (value) {
                return value.length === 2;
            },
            message: props => `${props.value} must be two numbers!`
        }*/
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

Schema.virtual('main_total').get(function() {
    return this.total_jackpot * 100 / 80;
});

const Lottery = mongoose.model('lotteries', Schema);

module.exports = Lottery;