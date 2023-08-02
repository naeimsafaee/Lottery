const Joi = require('joi');
var _ = require('lodash');
const moment = require("moment");

const express = require('express');
const router = express.Router();

const Lottery = require('../../Models/Lottery');
const Client = require('../../Models/Client');
const ClientLottery = require('../../Models/ClientLottery');
const NextClientLottery = require('../../Models/NextClientLottery');

const LotteryResources = require('../../Http/Resources/LotteryResource');
const ClientLotteryResource = require('../../Http/Resources/ClientLotteryResource');

const LoginMiddleware = require('../Middleware/AuthMiddleware');

const conous_payment = require("./../../Payment/payment");


router.get('/current', async (req, res) => {
    const current_lottery = await Lottery.findOne({
        has_ended: {
            $eq: false
        },
        start_date: {
            $lte: moment().format('YYYY-MM-DD HH:mm:ss')
        },
        end_date: {
            $gt: moment().format('YYYY-MM-DD HH:mm:ss')
        }
    }).sort({start_date: 'desc'});

    if (!current_lottery)
        return res.status(400).send(response("", "there is no lottery"))

    const price = current_lottery.total_jackpot;

    const current_payment = new conous_payment(process.env.CONOUS_API);

    const _exchange = await current_payment.exchange(price, 'xbt', 'usd', current_payment.CRYPTO_TO_FIAT)
    const expected_amount = JSON.parse(_exchange).data.converted_value;

    current_lottery.set('dollar_jackpot', expected_amount, {strict: false});

    return res.send(response(LotteryResources(current_lottery)));
});

router.get('/last', async (req, res) => {

    let lotteries = await Lottery.find({
        has_ended: true
    }, {}, {
        limit: parseInt(req.query.limit)
    }).sort({end_date: 'desc'});

    return res.send(response((lotteries)));
});

router.get('/:lottery_id', async (req, res) => {

    let lottery = await Lottery.findById(req.params.lottery_id);

    if (!lottery)
        return res.status(404).send(response([], "lottery not found!"));

    return res.send(response(LotteryResources(lottery)));
});

router.get('/', async (req, res) => {

    let lotteries = await Lottery.find({
        has_ended: true,
        "$expr": {
            "$and": [
                req.query.month ? { "$eq": [ { "$month": "$end_date" }, parseInt(req.query.month) ] } : {},
                req.query.year ? { "$eq": [ { "$year": "$end_date" }, parseInt(req.query.year) ] } : {}
            ]
        }
    }).sort({end_date: 'desc'});

    return res.send(response((lotteries)));
});

router.post('/', async (req, res) => {
    return;
    const {error} = Joi.object({
        name: Joi.string().required(),
        draw_price: Joi.number().required(),
        start_date: Joi.date().required(),
        days_left: Joi.number().required(),
    }).validate(req.body);

    if (error)
        return res.status(400).send(response([], error.details[0].message));

    const lottery = await new Lottery(
        {
            name: req.body.name,
            draw_price: req.body.draw_price,
            start_date: req.body.start_date,
            days_left: req.body.days_left
        }
    ).save();

    return res.send(response(LotteryResources(lottery)));
});

router.post('/participate', LoginMiddleware.login, async (req, res) => {
    const {error} = Joi.object({
        lottery_id: Joi.string().required(),
        draw_number: Joi.number(),
        min: Joi.number(),
        numbers: Joi.array().required().custom(
            (value, helper) => {

                if (value.length === 0)
                    return helper.message(`numbers are empty!`)

                if (value[0].constructor === Array) {
                    //it's 2D
                    for (let i = 0; i < value.length; i++) {
                        let check = check_numbers(value[i], helper);
                        if (check !== true)
                            return check;
                    }

                } else
                    return check_numbers(value, helper);

                function check_numbers(v, helper) {
                    if (v.length !== 5)
                        return helper.message(`size of numbers must be 5 !`)


                    for (let i = 0; i < v.length; i++) {
                        if (v[i] > 50)
                            return helper.message(`number ${v[i]} is greater than 50!`)
                    }

                    if (_.uniq(v).length !== 5)
                        return helper.message(`numbers must be unique!`);

                    return true;
                }

                return true;
            }),
        jokers: Joi.array().required().custom(
            (value, helper) => {

                if (value.length === 0)
                    return helper.message(`jokers are empty!`)

                if (value[0].constructor === Array) {
                    //it's 2D
                    for (let i = 0; i < value.length; i++) {
                        let check = check_numbers(value[i], helper);
                        if (check !== true)
                            return check;
                    }

                } else
                    return check_numbers(value, helper);

                function check_numbers(v, helper) {
                    if (v.length !== 2)
                        return helper.message(`size of jokers must be 2 !`)

                    for (let i = 0; i < v.length; i++) {
                        if (v[i] > 12)
                            return helper.message(`joker ${v[i]} is greater than 12!`)
                    }

                    if (_.uniq(v).length !== 2)
                        return helper.message(`jokers must be unique!`)

                    return true;
                }

                if (value.length !== req.body.numbers.length)
                    return helper.message(`numbers and jokers must have equal sizes!`);

                return true;
            }),
    }).validate(req.body);

    if (error)
        return res.status(400).send(response([], error.details[0].message));

    let lottery = await Lottery.findOne({
        _id: {
            $eq: req.body.lottery_id
        },
        has_ended: {
            $eq: false
        },
        end_date: {
            $gt: moment().format('YYYY-MM-DD HH:mm:ss')
        }
    });

    if (!lottery)
        return res.status(404).send(response([], "lottery not found!"));

    let client = req.user;

    const total_size = req.body.numbers.length;
    const total_price = parseInt(lottery.draw_price) * total_size;

    if (total_price > parseInt(client.wallet))
        return res.status(408).send(response([], "not enough money!"));

    let client_lottery = [];

    for (let i = 0; i < total_size; i++) {

        const numbers = req.body.numbers[i];
        const jokers = req.body.jokers[i];

        client_lottery.push(await new ClientLottery(
            {
                lottery_id: req.body.lottery_id,
                client_id: client,
                numbers: numbers,
                jokers: jokers,
            }
        ).save());
    }

    if (req.body.min || req.body.draw_number) {

        for (let i = 0; i < total_size; i++) {

            const numbers = req.body.numbers[i];
            const jokers = req.body.jokers[i];

            let options;

            if (req.body.min) {
                options = {
                    client: client,
                    numbers: numbers,
                    jokers: jokers,
                    min: req.body.min,
                };
            } else {
                options = {
                    client: client,
                    numbers: numbers,
                    jokers: jokers,
                    count: req.body.draw_number,
                };
            }

            await new NextClientLottery(
                options
            ).save()
        }

    }

    await Client.update({
        _id: client._id
    }, {
        wallet: parseInt(client.wallet) - total_price
    })

    await Lottery.update({
        _id: lottery._id
    }, {
        total_jackpot: parseInt(lottery.main_total) + total_price
    });


    return res.send(response(ClientLotteryResource(client_lottery), "you buy ticket successfully!"));
});


module.exports = router;