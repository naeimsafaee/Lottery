const express = require('express');
const router = express.Router();

router.use('/client', require('../app/Http/Controller/ClientController'));
router.use('/lottery', require('../app/Http/Controller/LotteryController'));
router.use('/ticket', require('../app/Http/Controller/TicketController'));
router.use('/coin', require('../app/Http/Controller/CoinController'));
router.use('/wallet', require('../app/Http/Controller/WalletController'));
router.use('/deposit', require('../app/Http/Controller/DepositController'));
router.use('/withdraw', require('../app/Http/Controller/WithdrawController'));
router.use('/transaction', require('../app/Http/Controller/TransactionController'));
router.use('/auth', require('../app/Http/Controller/AuthController'));
router.use('/prize', require('../app/Http/Controller/PrizeController'));
router.use('/crash', require('../app/Http/Controller/CrashController'));
router.use('/support', require('../app/Http/Controller/SupportController'));

module.exports = router;
