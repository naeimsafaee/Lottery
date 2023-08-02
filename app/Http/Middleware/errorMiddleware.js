// const winston = require("winston");


// winston.add(new winston.transports.Http());

/*winston.add(new winston.transports.File({
    filename: "logfile.log"
}));*/

module.exports = function (err , req, res , next){
    // winston.error(err.message  , err);
    if(process.env.APP_DEBUG)
        return res.status(500).send(response([] , err.message));

    return res.status(500).send(response([] , "Something failed."));
};