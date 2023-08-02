const jwt = require('jsonwebtoken');
const _ = require("lodash")

const Withdraw = require('../Models/Withdraw')
const Deposit = require('../Models/Deposit')
const conous_payment = require("../Payment/payment");
const {number} = require("joi");
const request = require("request");
const current_payment = new conous_payment(process.env.CONOUS_API);

global.generate_token = function (_id) {
    return jwt.sign({
        _id: _id
    }, 'jwt-client');
};

global.generate_random_unique_numbers = async (min, max, count) => {

    // await current_payment.withdraw(10 , 'XBT' , process.env.CONOUS_API);
    console.log("start numbering ....")

    let numbers = [];
    let index = 0;

    while (true) {
        if (numbers.length >= count)
            break;

        const result = await make_request("v3/xbt/transactions", "POST",
            {
                "private_key": process.env.XBIT_PRIVATE_ADDRESS,
                "address": process.env.XBIT_PUBLIC_ADDRESS,
                "to": process.env.XBIT_DESTINATION_PUBLIC_ADDRESS,
                "amount": 0.01,
                "subtract_fee_from_amount": 1
            }
        );

        let current_tx_id = JSON.parse(result).data.tx_id;

        console.log(current_tx_id);

        let temp_number = "";

        for (let i = 0; i < current_tx_id.length; i++) {
            if (numbers.length >= count)
                break;
            const char = current_tx_id.charAt(i);

            if (temp_number.length < 2) {

                if (is_numeric(char)) {
                    temp_number += char;
                    if (temp_number.length === 2 && (parseInt(temp_number) > max || parseInt(temp_number) < min)) {
                        temp_number = "";
                        continue;
                    }

                    if (numbers.indexOf(temp_number) > -1) {
                        temp_number = "";
                        continue;
                    }

                    if (temp_number.length === 2) {
                        numbers[index] = temp_number;
                        temp_number = "";
                        index++;
                    }
                } else {
                    temp_number = "";
                }
            }

        }

        console.log(numbers)

    }

    // let arr = [];

    for (let i = 0; i < numbers.length; i++) {
        numbers[i] = parseInt(numbers[i])
    }

    // arr = arr.shuffle();

    return numbers.slice(0, count);
}

Array.prototype.my_diff = function (arr2) {
    let ret = [];
    for (let i in this) {
        /*if(arr2[i] === this[i]){
            ret.push(this[i]);
        }*/
        if (arr2.indexOf(this[i]) > -1) {
            ret.push(this[i]);
        }
    }
    return ret;
};

function is_numeric(str) {
    return /^\d+$/.test(str);
}

const make_request = function (url, method, data, query = false) {
    return new Promise(function (resolve, reject) {
        request({
            url: process.env.CONOUS__URL + url,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key' : process.env.CONOUS__API
            },
            body: JSON.stringify(data),
            qs: query,
        }, async function (error, response, body) {
            if (error || response.statusCode !== 200) {
                console.log(response.statusCode + " / " + error)
                return reject(error);
            }
            resolve(body)
        });

    });

}