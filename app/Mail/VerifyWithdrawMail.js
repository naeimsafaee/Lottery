// const express = require('express');

module.exports = (app , amount , text , to) => {
    app.mailer.send('withdraw_verify', {
        to: to,
        subject: 'Verify your withdraw',
        amount: amount,
        code: text
    }, function (err) {
        if (err) {
            console.log("email : " + err);
            return;
        }
        console.log('Email Sent');
    });

}