const express = require('express');
const router = express.Router();

const Joi = require('joi');
const _ = require('lodash');

const Deposit = model('Deposit');
const Withdraw = model('Withdraw');
const ClientLottery = model('ClientLottery');

const LoginMiddleware = require('../Middleware/AuthMiddleware');

router.get('/', LoginMiddleware.login, async (req, res) => {

    const client = req.user;

    const withdraws = await Withdraw.find({
        client: {$eq: client._id}
    }).populate('coin').populate('client');

    const deposits = await Deposit.find({
        client: {$eq: client._id}
    }).populate('coin').populate('client');

    const buy_ticket = await ClientLottery.find({
        client_id: {$eq: client._id},
    }).populate('lottery_id');

    const win = await ClientLottery.find({
        client_id: {$eq: client._id},
        prize: {$exists: true , $gt: 0}
    });

    for (let i = 0; i < withdraws.length; i++) {
        withdraws[i].set("coin_name", withdraws[i].coin.name, {strict: false});
    }

    for (let i = 0; i < deposits.length; i++) {
        deposits[i].set("coin_name", deposits[i].coin.name, {strict: false});
    }

    return res.send(response({
        withdraws: JSON.parse(JSON.stringify(withdraws, ["_id", 'address', 'coin_name', 'tx_id', 'amount', 'created_at'])),
        deposits: JSON.parse(JSON.stringify(deposits, ["_id", 'address', 'coin_name', 'tx_id', 'amount', 'x_amount', 'created_at'])),
        buy_ticket: buy_ticket,
        win: win,
    }));
});


module.exports = router;