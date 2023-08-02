const express = require('express');
const router = express.Router();

const Client = require('../../Models/Client');
const ClientLottery = require('../../Models/ClientLottery');

const ClientLotteryResource = require('../../Http/Resources/ClientLotteryResource');

const LoginMiddleware = require('../Middleware/AuthMiddleware');

router.get('/',  LoginMiddleware.login , async (req, res) => {

    let client = req.user;

    if (!client)
        return res.status(404).send(response([], "client not found!"));

    const client_lotteries = await ClientLottery.find({
        client_id : {
            $eq: client._id
        }
    }).populate('lottery_id').sort({ created_at: 'desc' });

    /*client_lotteries.forEach(function (item) {
        item.set("prize", 13, { strict: false });
    })*/

    return res.send(response(client_lotteries));
});

module.exports = router;