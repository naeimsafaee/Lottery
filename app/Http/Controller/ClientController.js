const Joi = require('joi');
const bcrypt = require('bcrypt');
var _ = require('lodash');
const {passwordStrength} = require('check-password-strength')
const crypto = require("crypto");
const moment = require("moment");
const express = require('express');
const router = express.Router();

const Client = model('Client');

const LoginMiddleware = require('../Middleware/AuthMiddleware');

router.post('/', async (req, res) => {

    const {error} = Joi.object({
        firstname: Joi.string().required(),
        surname: Joi.string().required(),
        email: Joi.string().required().email({minDomainSegments: 2}),
        nickname: Joi.string().required(),
        birthdate: Joi.date().required(),
        salutation: Joi.string().required().valid(...['male', 'female', 'other']),
        username: Joi.string().required(),
        street: Joi.string().required(),
        number: Joi.string().required(),
        post_code: Joi.string().required(),
        location: Joi.string().required(),
        password: Joi.string().required().custom(
            (value, helper) => {
                /*if (passwordStrength(value).id < 2) {
                    return helper.message(`password is ${passwordStrength(value).value}!`)
                }*/
                return true;
            }),
    }).validate(req.body);

    if (error)
        return res.status(400).send(error.details);

    let client = await Client.findOne({
        $or: [
            {email: req.body.email},
            {username: req.body.username},
        ]
    });
    if (client)
        return res.status(400).send(response([], "The email or username already taken!"));

    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    req.body.email_confirm_link = Math.floor(Math.random() * 100000) + 10000;

    require('../../Mail/VerifyAccountMail')(req.app , req.body.email_confirm_link , req.body.email);

    client = await new Client(
        req.body
    ).save();

    return res.send(response(
        _.pick(client, ["_id", 'email', 'wallet', 'created_at']),
        "client created successfully! please confirm your account in your email"
    ));
});

router.put('/', LoginMiddleware.login,  async (req, res) => {
    const {error} = Joi.object({
        firstname: Joi.string().required(),
        surname: Joi.string().required(),
        nickname: Joi.string().required(),
        street: Joi.string().required(),
        number: Joi.string().required(),
        post_code: Joi.string().required(),
        location: Joi.string().required(),
        phone_number: Joi.string(),
        // deposit_limit: Joi.string().required(),
    }).validate(req.body);

    if (error)
        return res.status(400).send(error.details[0].message);

    let phone = "";

    if(req.body.phone_number)
        phone = req.body.phone_number;

    await Client.update({
        _id: req.user._id
    }, {
        firstname:req.body.firstname,
        surname:req.body.surname,
        nickname:req.body.nickname,
        street:req.body.street,
        number:req.body.number,
        post_code:req.body.post_code,
        location:req.body.location,
        phone_number: phone,
        deposit_limit: "0",
    });

    return res.send(response([],
        "client edited successfully!"
    ));
});

router.get('/', LoginMiddleware.login, async (req, res) => {

    let client = req.user;

    return res.send(response(_.pick(client, ["_id", 'email', 'is_crash_active', 'deposit_limit', 'firstname', 'surname','nickname' , 'street' , 'number' , 'post_code' , 'phone_number' , 'location', 'wallet', 'created_at'])));
});

router.post('/change_password', LoginMiddleware.login, async (req, res) => {

    let client = req.user;

    client.email_confirm_link = Math.floor(Math.random() * 100000) + 10000;
    client.email_verify_at = undefined;
    await client.save();

    require('../../Mail/ForgetPasswordMail')(req.app , client.email_confirm_link , client.email);

    return res.send(response(
        _.pick(client, ["_id", 'email', 'wallet', 'created_at']),
        "please check your email and enter code!"
    ));
    /* return res.header({'x-auth-token': generate_token(client._id)})
         .send(response(_.pick(client, ["_id", 'email', 'wallet', 'created_at'])));*/
});

router.put('/change_password/:code', LoginMiddleware.login, async (req, res) => {
    const {error} = Joi.object({
        password: Joi.string().required().custom(
            (value, helper) => {
                /*if (passwordStrength(value).id < 2) {
                    return helper.message(`password is ${passwordStrength(value).value}!`)
                }*/
                return true;
            }),
    }).validate(req.body);

    if (error)
        return res.status(400).send(error.details[0].message);

    let client = await Client.findOne({
        email_confirm_link: req.params.code
    });
    if (!client)
        return res.status(404).send(response([], "The code not found!"));

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    await Client.update({
        _id: client._id
    }, {
        password: password,
        email_confirm_link: null,
        email_verify_at: moment().format('YYYY-MM-DD HH:mm:ss')
    });

    return res.send(response(_.pick(client, ["_id", 'email', 'wallet', 'created_at']) , 'your password changed successfully!'));
});


module.exports = router;