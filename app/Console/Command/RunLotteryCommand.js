const moment = require("moment");

const Client = model('Client')
const Prize = model('Prize')
const Lottery = model("Lottery");
const Deposit = model("Deposit");
const ClientLottery = model("ClientLottery");
const NextClientLottery = model("NextClientLottery");
const LotteryPrize = model("LotteryPrize");

const conous_payment = require("../../Payment/payment");
const current_payment = new conous_payment(process.env.CONOUS_API);

module.exports = function () {

    this.interval_time = 1000 * 10;

    this.handle = async function () {

        Deposit.find({verified_at: {$exists: false}}).populate('coin').populate('client').then(async function (docs) {

            for (let i = 0; i < docs.length; i++) {

                const current_order = docs[i];

                // await current_payment.check_order();
                const tx_id = await current_payment.check_order(current_order.order_id, current_order.amount, current_order.coin.symbol);

                if (tx_id) {
                    //payment has paid
                    await Deposit.update(
                        {_id: current_order._id},
                        {tx_id: tx_id, verified_at: moment().format('YYYY-MM-DD HH:mm:ss')},
                    );

                    console.log('One transaction received! tx id : ' + tx_id);

                    const _exchange = await current_payment.exchange(current_order.amount, current_order.coin.symbol, 'xbt', current_order.CRYPTO_TO_CRYPTO)
                    const inc_wallet = JSON.parse(_exchange).data.converted_value;

                    await Client.update({_id: current_order.client.id}, {
                        wallet: current_order.client.wallet + inc_wallet
                    })

                }

            }
        });

        console.log('Lottery Command is running...');
        // console.log('date time is : ' + moment().format('YYYY-MM-DD HH:mm:ss'));

        const next_client_lotteries = await NextClientLottery.find({});

        const next_lotteries = await Lottery.find({
            has_ended: {
                $eq: false
            }
        }).sort({start_date: 'asc'});

        if (next_lotteries.length === 0) {
            await new Lottery({
                days_left: 7,
                name: "lottery " + (next_lotteries.length + 1),
                draw_price: 25,
                has_ended: false,
                start_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                end_date: moment().add(7, 'days').format('YYYY-MM-DD HH:mm:ss')
            }).save();
        }

        for (let i = 0; i < next_client_lotteries.length; i++) {

            const next_client_lottery = next_client_lotteries[i];

            for (let j = 0; j < next_lotteries.length; j++) {

                const lottery = next_lotteries[j];

                const client = await Client.findOne({
                    _id: next_client_lottery.client
                });

                const current_client_with_this_lottery = await ClientLottery.find({
                    client_id: client._id,
                    lottery_id: lottery._id,
                    numbers: next_client_lottery.numbers,
                    jokers: next_client_lottery.jokers,
                });

                if (current_client_with_this_lottery && current_client_with_this_lottery.length > 0) {

                } else {
                    if (lottery.draw_price <= client.wallet) {
                        if (next_client_lottery.count > 0) {

                            await Client.update({_id: client._id}, {
                                wallet: client.wallet - lottery.draw_price
                            });

                            await new ClientLottery({
                                lottery_id: lottery._id,
                                client_id: next_client_lottery.client,
                                numbers: next_client_lottery.numbers,
                                jokers: next_client_lottery.jokers,
                            }).save();

                            // next_client_lottery.count--;

                            if (next_client_lottery.count <= 1) {
                                await NextClientLottery.remove({_id: next_client_lottery._id});
                            } else {
                                await NextClientLottery.update({_id: next_client_lottery._id}, {
                                    count: next_client_lottery.count - 1
                                });
                            }

                        } else if (next_client_lottery.min <= lottery.total_jackpot) {

                            const last_client_lottery = await ClientLottery.find({
                                lottery_id: lottery._id,
                                client_id: next_client_lottery.client,
                                numbers: next_client_lottery.numbers,
                                jokers: next_client_lottery.jokers,
                            });

                            if (last_client_lottery.length === 1) {
                                await Client.update({_id: client._id}, {
                                    wallet: client.wallet - lottery.draw_price
                                });

                                await new ClientLottery({
                                    lottery_id: lottery._id,
                                    client_id: next_client_lottery.client,
                                    numbers: next_client_lottery.numbers,
                                    jokers: next_client_lottery.jokers,
                                }).save();
                            }

                        } else if (next_client_lottery.count === 0) {
                            await NextClientLottery.remove({_id: next_client_lottery._id});
                        }
                    }
                }

            }

        }

        const lotteries = await Lottery.find({
            has_ended: {
                $eq: false
            },
            end_date: {
                $lte: moment().format('YYYY-MM-DD HH:mm:ss')
            }
        });

        for (let i = 0; i < lotteries.length; i++) {
            const lottery = lotteries[i];

            let is_ended_date_past = moment(lottery.end_date, "YYYY-MM-DD HH:mm:ss").isBefore();

            // console.log(moment(lottery.start_date, "YYYY-MM-DD HH:mm:ss").add(lottery.days_left, 'days').isBefore());
            if (is_ended_date_past) {
                //lottery has ended
                // if (lottery.have_to_run) {
                const numbers = await generate_random_unique_numbers(1, 50, 5);
                const jokers = await generate_random_unique_numbers(1, 12, 2);

                console.log("numbers are : " + numbers)
                console.log("jokers are : " + jokers)

                await Lottery.update(
                    {
                        _id: lottery._id
                    }, {
                        has_ended: true,
                        have_to_run: false,
                        numbers: numbers,
                        jokers: jokers,
                    }
                );

                const lottery_jackpot = parseInt(await deal_prize(lottery, numbers, jokers));
                console.log("dealing done.")

                let new_current_lottery = await Lottery.findOne({
                    has_ended: {
                        $eq: false
                    }
                });

                if (!new_current_lottery) {
                    await new Lottery({
                        days_left: 7,
                        name: "lottery " + (lotteries.length + 1),
                        draw_price: 25,
                        has_ended: false,
                        start_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                        end_date: moment().add(7, 'days').format('YYYY-MM-DD HH:mm:ss')
                    }).save();

                    new_current_lottery = await Lottery.findOne({
                        has_ended: {
                            $eq: false
                        }
                    }).sort({start_date: 'asc'})
                }

                await Lottery.update(
                    {
                        _id: new_current_lottery._id
                    }, {
                        total_jackpot: lottery_jackpot * 100 / 80
                    }
                );

                // }

                break;
            }

        }

    }

    async function deal_prize(lottery, numbers, jokers) {

        const prizes = await Prize.find({}).lean();

        let grouped_client_lotteries = {};

        for (let i = 0; i < prizes.length; i++) {
            grouped_client_lotteries[prizes[i]["number"].toString() + prizes[i]["joker"].toString()] = 0;

            prizes[i]["price"] = lottery.total_jackpot * prizes[i].prize / 100;
        }

        const client_lotteries = await ClientLottery.find({
            lottery_id: lottery,
            prize: {$exists: false}
        }).populate('client_id');

        for (let i = 0; i < client_lotteries.length; i++) {

            const client_lottery = client_lotteries[i];

            const key = numbers.my_diff(client_lottery.numbers).length.toString()
                + jokers.my_diff(client_lottery.jokers).length.toString();

            if (grouped_client_lotteries[key] !== undefined)
                grouped_client_lotteries[key]++;
            else
                grouped_client_lotteries[key] = 1;

        }

        let total_prize = 0;

        for (let i = 0; i < client_lotteries.length; i++) {

            const client_lottery = client_lotteries[i];

            const number_length = numbers.my_diff(client_lottery.numbers).length;
            const joker_length = jokers.my_diff(client_lottery.jokers).length;

            let total_client_prize = prizes.filter(function (prize) {
                return prize["number"] === number_length && prize["joker"] === joker_length;
            });

            let prize = 0;

            if (total_client_prize.length > 0) {

                const total_client_prize_id = total_client_prize[0]._id;
                total_client_prize = parseFloat(total_client_prize[0].prize);

                const key = number_length.toString()
                    + joker_length.toString();

                let anybody_prize = parseInt(lottery.total_jackpot) * (total_client_prize) / 100 / grouped_client_lotteries[key];

                anybody_prize = Math.ceil(anybody_prize);

                const temp_lottery_prize = await LotteryPrize.find({
                    lottery: lottery._id,
                    prize: total_client_prize_id,
                });

                if (temp_lottery_prize.length === 0) {
                    await new LotteryPrize({
                        lottery: lottery._id,
                        prize: total_client_prize_id,
                        amount: parseInt(lottery.total_jackpot) * total_client_prize / 100,
                        count: grouped_client_lotteries[key]
                    }).save()
                }

                await Client.updateOne({
                    _id: client_lottery.client_id
                }, {
                    wallet: client_lottery.client_id.wallet + anybody_prize
                });

                total_prize += anybody_prize;

                prize = anybody_prize;

                console.log("\x1b[32m", "one client win " + anybody_prize)
            }

            await ClientLottery.updateOne({
                _id: client_lottery._id
            }, {
                prize: prize
            });

        }

        /*await Lottery.update(
            {
                _id: lottery._id
            }, {
                total_jackpot: lottery.total_jackpot - total_prize
            }
        );*/
        // await ClientLottery.remove({});

        return lottery.total_jackpot - total_prize;
    }

};