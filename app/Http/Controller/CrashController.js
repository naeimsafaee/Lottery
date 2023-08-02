const Joi = require('joi');
const _ = require('lodash');
const moment = require('moment');
const request = require("request");

const express = require('express');
const router = express.Router();

const Client = model('Client');
const LoginMiddleware = require('../Middleware/AuthMiddleware');

router.get('/activate', LoginMiddleware.login, async (req, res) => {

    let client = req.user;

    if (client.is_crash_active && client.is_crash_active === true)
        return res.status(400).send('you activate before!');

    await Client.update({
        _id: req.user._id
    }, {
        is_crash_active: true
    });

    await make_request('registerRemoteUser', 'POST', {
        "password": process.env.CRASH_PASSWORD,
        "username": client.username,
        "email": client.email
    });

    return res.send(response("done"));
});

router.get('/enter', LoginMiddleware.login, async (req, res) => {

    let client = req.user;

    const result = await make_request('RequestToken', 'POST', {
        "password": process.env.CRASH_PASSWORD,
        "username": client.username,
    });

    console.log({
        "password": process.env.CRASH_PASSWORD,
        "username": client.username,
    })

    return res.send(response(
        process.env.CRASH_URL + "login/" + client.username + "/" + JSON.parse(result).token
    ));
});

router.post('/withdraw_to_crash', LoginMiddleware.login, async (req, res) => {

    let client = req.user;
    if (client.wallet < parseInt(req.body.amount))
        return res.status(400).send(response('' , 'you do not have enough money!'));

    const result = await make_request('Chips', 'POST', {
        "password": process.env.CRASH_PASSWORD,
        "username": client.username,
        "amount": parseInt(req.body.amount),
        "action": "increaseChips"
    });

    await Client.update({
        _id: req.user._id
    }, {
        wallet: client.wallet - req.body.amount
    });

    return res.send(response(
        "ok"
    ));
});

router.post('/deposit_from_crash', LoginMiddleware.login, async (req, res) => {

    let client = req.user;

    const result = await make_request('Chips', 'POST', {
        "password": process.env.CRASH_PASSWORD,
        "username": client.username,
        "amount": req.body.amount,
        "action": "decreaseChips"
    });

    if (JSON.parse(result).success == false) {
        return res.status(400).send(response('' ,'you do not have enough money in crash!'));
    }

    await Client.update({
        _id: req.user._id
    }, {
        wallet: client.wallet + req.body.amount
    });

    return res.send(response(
        "ok"
    ));
});

router.get('/wallet', LoginMiddleware.login, async (req, res) => {

    let client = req.user;

    const result = await make_request('Chips', 'POST', {
        "password": process.env.CRASH_PASSWORD,
        "username": client.username,
        "amount": 0,
        "action": "getChips"
    });

    return res.send(response(
        result
    ));
});


const make_request = function (url, method, data, query = false) {
    return new Promise(function (resolve, reject) {
        request({
            url: process.env.CRASH_URL + url,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            qs: query,
        }, async function (error, response, body) {
            if (error || response.statusCode !== 200) {
                console.log(error)
                return reject(error);
            }
            resolve(body)
        });

    });

}

module.exports = router;