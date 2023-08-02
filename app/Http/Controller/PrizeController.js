const express = require('express');
const router = express.Router();

const Prize = require('../../Models/Prize');
const LotteryPrize = require('../../Models/LotteryPrize');

router.post('/', async (req, res) => {

    const prizes = await Prize.find().lean();

    for (let i = 0; i < prizes.length; i++) {
        prizes[i]["prizes"] = await LotteryPrize.findOne({
            prize: prizes[i]._id,
            lottery: req.body.lottery_id,
        })
    }


    return res.send(response((prizes)));
});


module.exports = router;