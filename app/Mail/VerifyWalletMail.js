// const express = require('express');

module.exports = (app , address , text , to) => {
    app.mailer.send('wallet_verify', {
        to: to,
        subject: 'Verify your address wallet',
        address: address,
        code: text
    }, function (err) {
        if (err) {
            console.log("email : " + err);
            return;
        }
        console.log('Email Sent');
    });

}