const Joi = require('joi');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const moment = require('moment');
const crypto = require("crypto");
const request = require("request");
const {passwordStrength} = require('check-password-strength')
const {ClientCredentials, ResourceOwnerPassword, AuthorizationCode} = require('simple-oauth2');
const {google} = require('googleapis');

const ClientOAuth2 = require('client-oauth2')

const config = {
    clientId:  process.env.COUNOS_CLIENT_ID,
    clientSecret: process.env.COUNOS_CLIENT_SECRET,
    accessTokenUri: 'https://counos.com/connect/token',
    authorizationUri: 'https://counos.com/connect/authorize',
    redirectUri: 'https://xbitlotto.com/loginWithCouos',
    scopes: ['openid', 'profile', 'email']
};


const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://xbitlotto.com/loginWithGoogle'
);

const express = require('express');
const router = express.Router();

const Client = model('Client');

/*Joi.array()
    .items({
        keyword: Joi.string()
            .required(),
        country_code: Joi.string()
            .required(),
        language: Joi.string()
            .required(),
        depth: Joi.number()
            .required(),
    })*/

router.get('/verify/:confirm_link', async (req, res) => {

    let client = await Client.findOne({
        email_confirm_link: req.params.confirm_link
    });
    if (!client)
        return res.status(404).send(response([], "The Confirm link not found!"));

    await Client.update({
        _id: client._id
    }, {
        email_confirm_link: null,
        email_verify_at: moment().format('YYYY-MM-DD HH:mm:ss')
    });

    return res.header({'x-auth-token': generate_token(client._id)})
        .send(response(_.pick(client, ["_id", 'email', 'wallet', 'created_at'])
        ));
});

router.post('/login', async (req, res) => {
    const {error} = Joi.object({
        email: Joi.string().required().email({minDomainSegments: 2}),
        password: Joi.string().required()
    }).validate(req.body);

    if (error)
        return res.status(400).send(error.details[0].message);

    let client = await Client.findOne({email: req.body.email});
    if (!client)
        return res.status(400).send('Invalid email or password!');

    if (!await bcrypt.compare(req.body.password, client.password))
        return res.status(400).send('Invalid email or password!');


    client.email_confirm_link = Math.floor(Math.random() * 100000) + 10000;
    client.email_verify_at = undefined;
    await client.save();

    require('../../Mail/VerifyAccountMail')(req.app, client.email_confirm_link, client.email);

    return res.send(response(
        _.pick(client, ["_id", 'email', 'wallet', 'created_at']),
        "please confirm your account in your email"
    ));
    /* return res.header({'x-auth-token': generate_token(client._id)})
         .send(response(_.pick(client, ["_id", 'email', 'wallet', 'created_at'])));*/
});

router.post('/forget', async (req, res) => {
    const {error} = Joi.object({
        email: Joi.string().required().email({minDomainSegments: 2}),
    }).validate(req.body);

    if (error)
        return res.status(400).send(error.details[0].message);

    let client = await Client.findOne({email: req.body.email});
    if (!client)
        return res.status(400).send('Invalid email!');

    client.email_confirm_link = Math.floor(Math.random() * 100000) + 10000;
    client.email_verify_at = undefined;
    await client.save();

    require('../../Mail/ForgetPasswordMail')(req.app, client.email_confirm_link, client.email);

    return res.send(response(
        _.pick(client, ["_id", 'email', 'wallet', 'created_at']),
        "please check your email and enter code!"
    ));
    /* return res.header({'x-auth-token': generate_token(client._id)})
         .send(response(_.pick(client, ["_id", 'email', 'wallet', 'created_at'])));*/
});

router.put('/forget/:code', async (req, res) => {
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

    return res.header({'x-auth-token': generate_token(client._id)})
        .send(response(_.pick(client, ["_id", 'email', 'wallet', 'created_at'])
        ));
});

router.post('/check_user_exists', async (req, res) => {
    const {error} = Joi.object({
        email: Joi.string().email({minDomainSegments: 2}),
        username: Joi.string(),
    }).validate(req.body);

    if (error)
        return res.status(400).send(error.details[0].message);

    if (req.body.username) {
        let client = await Client.findOne({username: req.body.username});
        if (client)
            return res.status(400).send('username already exists!');
    }

    if (req.body.email) {
        let client = await Client.findOne({email: req.body.email});
        if (client)
            return res.status(400).send('email already exists!');
    }

    return res.send(response([], "ok"));
});

router.post('/complete_data', async (req, res) => {
    const {error} = Joi.object({
        email: Joi.string().email({minDomainSegments: 2}),
        username: Joi.string(),
    }).validate(req.body);

    if (error)
        return res.status(400).send(error.details[0].message);

    if (req.body.username) {
        let client = await Client.findOne({username: req.body.username});
        if (client)
            return res.status(400).send('username already exists!');
    }

    if (req.body.email) {
        let client = await Client.findOne({email: req.body.email});
        if (client)
            return res.status(400).send('email already exists!');
    }

    return res.send(response([], "ok"));
});

router.post('/callback', async (req, _res) => {

    request({
        url: 'https://counos.com/connect/userinfo',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${req.body.token}`,
            'Accept': 'application/json'
        }
    }, async function (error, res, body) {
        if (error || res.statusCode !== 200) {
            return _res.status(400).send(res.statusCode);
        }

        res = JSON.parse(res.body);

        let client = await Client.findOne({
            email: res.email
        });
        if (!client) {
            // return _res.status(400).send('');
            client = await new Client({
                'firstname': res.given_name,
                'surname': res.family_name,
                'nickname': res.given_name + res.family_name,
                'username': res.preferred_username,
                'email': res.email,
                'password': 'password by oauth2',
                'salutation': 'other',
            }).save();

        }

        return _res.header({'x-auth-token': generate_token(client._id)})
            .send(response(_.pick(client, ["_id", 'email', 'wallet', 'created_at'])
            ));
    });

});

router.get('/conous/:state', async (req, res) => {
    config.state = req.params.state;

    const githubAuth = new ClientOAuth2(config);
    var uri = githubAuth.code.getUri();

    return res.send(uri)

    /*const client = new AuthorizationCode({
        client: {
            id: 'lotto',
            secret: '71cfffe6-d2f1-46fd-80b1-8ec768972eda',
        },
        auth: {
            tokenHost: 'https://counos.com/connect/token',
            authorizePath:'https://counos.com/connect/authorize'
        }
    });

    const authorizationUri = client.authorizeURL({
        redirect_uri: 'https://lotto-api.xbitcc.com/api/auth/callback',
    });

    res.type('json').send(authorizationUri);
    // res.type('json').redirect(authorizationUri);
    //
    try {
        const accessToken = await client.getToken( {
            code: '<code>',
            redirect_uri: 'https://lotto-api.xbitcc.com/api/auth/callback',
            scope: '<scope>',
        });
    } catch (error) {
        console.log('Access Token Error', error.message);
    }*/
})

router.post('/google-callback', async (req, res) => {

    const {tokens} = await oauth2Client.getToken(req.body.code)
    oauth2Client.setCredentials(tokens);

    let oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
    });
    let {data} = await oauth2.userinfo.get();

    let client = await Client.findOne({
        email: data.email
    });
    if (!client) {
        client = await new Client({
            'firstname': data.given_name,
            'surname': data.family_name,
            'nickname': data.given_name + res.family_name,
            'username': data.email,
            'email': data.email,
            'password': 'password by oauth2 google',
            'salutation': 'other',
        }).save();
    }

    return res.header({'x-auth-token': generate_token(client._id)})
        .send(response(_.pick(client, ["_id", 'email', 'wallet', 'created_at'])
        ));
});

router.get('/google', async (req, res) => {
   /* config.state = req.params.state;

    const githubAuth = new ClientOAuth2(g_config);
    var uri = githubAuth.code.getUri();

    return res.send(uri);*/

// generate a url that asks permissions for Blogger and Google Calendar scopes
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',

        // If you only need one scope you can pass it as a string
        scope: scopes
    });

    return res.send(url);
})

module.exports = router;