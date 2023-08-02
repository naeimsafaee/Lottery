const request = require('request');

module.exports = function (api_key) {

    const base_url = "https://payment.counos.io/api/";

    this.CRYPTO_TO_CRYPTO = 0;
    this.FIAT_TO_CRYPTO = 1;
    this.CRYPTO_TO_FIAT = 2;

    const exchange_model = (amount, from, to) => {
        return {
            "amount": amount,
            "from": from,
            "to": to,
            "rateOfchangePercentage": "0",
        }
    };

    const order = (order_id, payment_base_coin_id, amount, renew) => {
        return {
            "orderId": order_id,
            "tickerId": payment_base_coin_id,
            "expectedAmount": amount,
            "renew": renew,
        }
    };

    const coin_list = async function () {
        const url = get_api_end_point("terminal/tickers");

        let coins = [];

        try {
            coins = JSON.parse(await make_request(url, "GET", {}, {})).data;
        } catch (error) {
            return false;
        }
        return coins;
    }

    this.new_order_from_crypto = async function (order_id, payment_base_coin, amount, renew = false) {

        const url = get_api_end_point('terminal/order');

        const payment_base_coin_id = (await find_coin_by_id(payment_base_coin)).id;

        return new Promise(function (resolve, reject) {
            make_request(url, "POST", order(order_id, payment_base_coin_id, amount, renew))
                .then(function (data) {
                    console.log(data);
                    // return JSON.parse(data).data;
                    resolve(JSON.parse(data).data);
                })
                .catch(function (err) {
                    console.log("err" + err);
                    reject(error)
                    // return false;
                });
        });

    }

    this.new_order_from_fiat = async function (order_id, payment_base_coin, amount_base, amount, renew = false) {

        const _this = this;

        this.exchange(amount, amount_base, payment_base_coin, this.FIAT_TO_CRYPTO).then((data) => {

            const amount_from_exchange = JSON.parse(data).data.converted_value;

            return _this.new_order_from_crypto(
                order_id,
                payment_base_coin,
                amount_from_exchange,
                renew
            );
        }).catch(function (err) {
            console.log("err : " + err);
            return false;
        });
    }

    this.exchange = function (amount, from, to, exchange_type = this.CRYPTO_TO_CRYPTO) {
        const _this = this;
        return new Promise(function (resolve, reject) {

            let url = "";
            if (exchange_type === _this.CRYPTO_TO_CRYPTO) {
                url = get_api_end_point('exchange/rate/crypto2crypto/convert');

            } else if (exchange_type === _this.FIAT_TO_CRYPTO) {
                url = get_api_end_point('exchange/rate/currency2crypto/convert');

            } else/* if (exchange_type === _this.CRYPTO_TO_FIAT) */{
                url = get_api_end_point('exchange/rate/crypto2currency/convert');
            }

            make_request(url, "GET", {}, exchange_model(amount, from, to))
                .then(function (data) {
                    resolve(data);
                })
                .catch(function (error) {
                    reject(error)
                });
        });
    }

    this.check_order = function (order_id, amount, coin_symbol) {
        return new Promise((resolve, reject) => {
            const url = get_api_end_point("terminal/order") + `/${order_id}`;

            make_request(url, "GET", {}, {})
                .then(function (data) {

                    data = JSON.parse(data).data;

                    if (data.paid === true) {
                        if (parseInt(data.paidAmount) >= parseInt(amount)) {
                            if (data.ticker.keyword.toString().toLowerCase() === coin_symbol.toString().toLowerCase()) {
                                resolve(data.transactionId);
                            }
                        }
                    }
                    resolve(false);
                    // console.log("sasad" + data)
                })
                .catch(function (err) {
                    console.log("err : " + err)
                    reject(err);
                })
        });

    }

    this.withdraw = async function (amount, coin_symbol, to) {
        const url = get_api_end_point("terminal/withdraw");

        return await make_request(url, "POST", {amount: amount, tickerId: (await find_coin_by_id(coin_symbol)).id, walletAddress: to}, {});
    }

    const find_coin_by_id = async function (symbol) {
        const coins = await coin_list();

        return coins.find(item => item.keyword.toLowerCase() === symbol.toLowerCase())
    }

    const get_api_end_point = function (end_point) {
        return base_url + end_point;
    }

    const make_request = function (url, method, data, query = false) {
        // console.log(url);
        // console.log(data);
        return new Promise(function (resolve, reject) {
            request({
                url: url,
                method: method,
                body: JSON.stringify(data),
                qs: query,
                headers: {
                    "accept": "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": api_key
                }
            }, async function (error, response, body) {
                // console.log(url + " : " + response.statusCode)
                if (error || response.statusCode !== 200)
                    reject(error);
                resolve(body)
            });

        });

    }

};




