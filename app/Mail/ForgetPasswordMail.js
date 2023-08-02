// const express = require('express');

module.exports = (app , text , to) => {
    app.mailer.send('forget_password', {
        to: to,
        subject: 'Request forget PASSWORD',
        code: text
    }, function (err) {
        if (err) {
            console.log("email : " + err);
            return;
        }
        console.log('Email Sent');
    });

}