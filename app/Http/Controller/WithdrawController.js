const express = require('express');
const router = express.Router();

const moment = require('moment');
const Joi = require('joi');
const _ = require('lodash');

const Coin = model('Coin');
const Wallet = model('Wallet');
const Withdraw = model('Withdraw');

const LoginMiddleware = require('../Middleware/AuthMiddleware');

router.post('/', LoginMiddleware.login, async (req, res) => {
    const {error} = Joi.object({
        amount: Joi.string().required(),
        coin_id: Joi.string().required(),
    }).validate(req.body);

    if (error)
        return res.status(400).send(response([], error.details[0].message));

    let coin = await Coin.findById(req.body.coin_id);

    if (!coin)
        return res.status(404).send(response([], "coin not found!"));

    if (coin.symbol !== 'xbt')
        return res.status(404).send(response([], "withdraw only available with Xbit!"));

    const client = req.user;
    if (client.wallet < req.body.amount)
        return res.status(400).send(response([], "not enough money!"));

    let client_wallet = await Wallet.findOne({
        coin: coin,
        client: client,
        verified_at: {$exists: true}
    });

    if (!client_wallet)
        return res.status(400).send(response([], "you did not set x-bit address wallet, please add in setting!"));

    const email_confirm_link = Math.floor(Math.random() * 100000) + 10000;

    require('../../Mail/VerifyWithdrawMail')(req.app, req.body.amount, email_confirm_link, client.email);

    let withdraw = await new Withdraw({
        address: client_wallet.address,
        client: client,
        amount: req.body.amount,
        email_confirm_link: email_confirm_link,
        coin: coin,
    }).save();

    return res.send(response(_.pick(withdraw, ["_id", 'address', 'coin.name', 'client.username', 'created_at']), "new withdraw created successfully, please confirm in your email!"));
});

router.get('/verify/:confirm_link', LoginMiddleware.login, async (req, res) => {

    let withdraw = await Withdraw.findOne({
        email_confirm_link: req.params.confirm_link
    });
    if (!withdraw)
        return res.status(404).send(response([], "The Confirm link not found!"));

    await Withdraw.update({
        _id: withdraw._id
    }, {
        email_confirm_link: null,
        verified_at: moment().format('YYYY-MM-DD HH:mm:ss')
    });

    return res.send(response(_.pick(withdraw, ["_id", 'address', 'amount', 'created_at'])));
});

router.get('/', async (req, res) => {

    const page = req.query.page > 1 ? --req.query.page : 0;
    const limit = req.query.per_page ? parseInt(req.query.per_page) : 12;

    const total_withdraw = await Withdraw.count({
        tx_id: {$exists: true}
    });
    const sum_withdraw = (await Withdraw.aggregate([
            {
                "$match": {
                    tx_id: {$exists: true}
                }
            },
            {
                "$group": {
                    "_id": null,
                    "total": {
                        "$sum": {
                            "$toDouble": "$amount"
                        }
                    }
                }
            }
        ]))[0].total;
    const total_page = Math.ceil(total_withdraw / limit);

    let withdraw = await Withdraw.find({
        tx_id: {$exists: true}
    }, {}, {
        skip: page * limit,
        limit: limit
    }).populate('client', '-password -email_confirm_link -email_verify_at -birthdate -post_code -number -location -street -salutation -wallet')
        .sort({created_at: 'desc'});


    return res.send(response(withdraw, {total_page, total_withdraw, sum_withdraw}));
});


module.exports = router;