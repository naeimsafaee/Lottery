

module.exports = function (app){

    console.log('cors enabled.');

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, access-control-expose-headers ,x-auth-token");
        next();
    });

    const cors = require("cors");

    app.use(cors({ origin: '*' , credentials :  true , exposedHeaders: ['x-auth-token']}));

}