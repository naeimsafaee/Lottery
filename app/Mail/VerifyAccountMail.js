// const express = require('express');

module.exports = (app , text , to) => {
    app.mailer.send('account_verify', {
        to: to,
        subject: 'Verify your account',
        code: text
    }, function (err) {
        if (err) {
            console.log("email : " + err);
            return;
        }
        console.log('Email Sent');
    });

}