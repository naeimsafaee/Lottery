const express = require('express');
const router = express.Router();

const moment = require('moment');

const Wallet = model('Wallet');

const LoginMiddleware = require('../Middleware/AuthMiddleware');

router.post('/',  LoginMiddleware.login, async (req, res) => {

    let client = req.user;

    const wallets = req.body;

    const code = Math.floor(Math.random() * 100000) + 10000;

    let address_wallets = "";

    for (let i = 0; i < wallets.length; i++) {
        await new Wallet({
            client: client._id,
            coin: wallets[i].coin_id,
            address: wallets[i].address,
            verify_code: code
        }).save();

        address_wallets += wallets[i].address + "\n";
    }

    require('../../Mail/VerifyWalletMail')(req.app , address_wallets , code , client.email);

    return res.send(response([] , 'Please confirm your wallet in your mail'));
});

router.get('/:verify_code',  LoginMiddleware.login, async (req, res) => {

    let client = req.user;

    const verify_code = req.params.verify_code;

    const wallet = await Wallet.findOne({
        verify_code: verify_code,
        client: client._id,
    });

    wallet.verify_code = undefined;
    wallet.verified_at = moment().format('YYYY-MM-DD HH:mm:ss');
    await wallet.save()

    return res.send(response([] , 'wallets verified successfully!'));
});

module.exports = router;