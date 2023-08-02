const express = require('express');
const router = express.Router();

const Coin = model('Coin');
const Wallet = model('Wallet');

const LoginMiddleware = require('../Middleware/AuthMiddleware');

router.get('/', LoginMiddleware.login, async (req, res) => {

    const coins = await Coin.find();
    const client = req.user;

    for (const item of coins) {

        let client_wallet = await Wallet.findOne({
            coin : item,
            client: client,
            verified_at: { $exists: true }
        }).sort({created_at: 'desc'});

        if(client_wallet)
            client_wallet = client_wallet.address;

        item.set("client_address", client_wallet, { strict: false });
    }

    return res.send(response(coins));
});

module.exports = router;