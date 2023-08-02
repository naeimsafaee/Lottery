module.exports = function () {

    const commands = [
        'RunLotteryCommand'
    ];

    commands.forEach((file) => {

        const command = new (require(__dirname + "/Command/" + file))();

        setInterval(command.handle, command.interval_time)

    });


};