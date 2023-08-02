const express = require('express');
const router = express.Router();

const Joi = require('joi');
const _ = require('lodash');

const Client = model('Client');
const Coin = model('Coin');
const Deposit = model('Deposit');

const conous_payment = require("./../../Payment/payment");

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

    const client = req.user;

    const order_id = parseInt(Math.random().toString().replace("." , ""));

    const current_payment = new conous_payment(process.env.CONOUS_API);

    const _exchange = await current_payment.exchange(req.body.amount, 'xbt',  coin.symbol, current_payment.CRYPTO_TO_CRYPTO)
    const expected_amount = JSON.parse(_exchange).data.converted_value;

    const conuos_order = await current_payment.new_order_from_crypto(order_id , coin.symbol ,expected_amount)

    let deposit = await new Deposit({
        address: conuos_order.orderAddress,
        order_id: order_id,
        client: client,
        amount: expected_amount,
        x_amount: req.body.amount,
        coin: coin,
    }).save();

    deposit.qr_code = conuos_order.paymentUriQrCode;

    return res.send(response(_.pick(deposit, ["_id", 'amount' , 'x_amount' , 'coin.name' , 'client.username' , 'created_at' , 'address' , 'qr_code']) , "new deposit created successfully,please pay it"));
});

module.exports = router;