const mongoose = require('mongoose');
require('mongoose-double')(mongoose);

const SchemaTypes = mongoose.Schema.Types;

const Schema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    wallet: {
        type: Number,
        required: true,
        default: 0,
        get: (ret) => {
            return parseFloat(ret);
            /*if (ret.price) {
                ret.price = ret.price.toString();
            }
            delete ret.__v;
            return ret;*/
        }
    },
    email_confirm_link: {
        type: String
    },
    email_verify_at: {
        type: Date,
    },
    salutation: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    birthdate: {
        type: Date,
    },
    street: {
        type: String
    },
    number: {
        type: String
    },
    post_code: {
        type: String
    },
    location: {
        type: String
    },
    phone_number: {
        type: String
    },
    deposit_limit: {
        type: String
    },
    is_crash_active: {
        type: Boolean,
        default: false
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

const Client = mongoose.model('clients', Schema);

module.exports = Client;