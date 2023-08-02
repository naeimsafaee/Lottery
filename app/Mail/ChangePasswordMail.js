// const express = require('express');

module.exports = (app , text , to) => {
    app.mailer.send('change_password', {
        to: to,
        subject: 'Request change PASSWORD',
        code: text
    }, function (err) {
        if (err) {
            console.log("email : " + err);
            return;
        }
        console.log('Email Sent');
    });

}