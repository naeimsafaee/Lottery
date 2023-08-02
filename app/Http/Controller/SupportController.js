const express = require('express');
const router = express.Router();

const Support = require("../../Models/Supoort");

router.post('/', async (req, res) => {

    const {
        name,
        email,
        description
    } = req.body;

    await new Support({
        name,
        email,
        description,
    }).save();

    return res.send(response([], 'We receive your message and will contact you as soon as possible!'));
});


module.exports = router;