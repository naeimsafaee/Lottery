require("express-async-errors");
const express = require('express');
const app = express();
const config = require('config');
require('dotenv').config()


app.use((req, res, next) => {
    res.locals.app_url = process.env.APP_URL;
    next()
})

app.set('view engine', 'pug');
app.set('views', './views');

require('./app/Helper/helper');

require('./app/Providers/DataBaseServiceProvider');
require('./app/Providers/MailServiceProvider')(app);

require('./app/Http/Middleware/Cors')(app);

/*process.on("uncaughtException", (ex) => {
    throw ex;
});*/
/*process.on("unhandledRejection", (ex) => {
    throw ex;
});*/

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(express.static('public'));

global.model = function(model_name){
    const model_namespace = "/app/Models/";

    return require(__dirname + model_namespace + model_name);
};


app.use(config.get("api.prefix"), require(config.get('api.route')));
app.use(config.get('web.prefix'), require(config.get('web.route')));

app.use(require("./app/Http/Middleware/errorMiddleware"));

app.listen(process.env.APP_PORT, function () {
    console.log(`Listening on port ${process.env.APP_PORT}...`);
    console.log(process.env.APP_URL);
});

String.prototype.replaceAll = function(search, replacement) {
    return this.replace(new RegExp(search, 'g'), replacement);
};

Array.prototype.shuffle = function () {
    let currentIndex = this.length,  randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [this[currentIndex], this[randomIndex]] = [
            this[randomIndex], this[currentIndex]];
    }

    return this;
}

global.response = function(data , message = ""){
    return {
        "data" : data,
        "message" : typeof message === "string" ? message.replaceAll("\"" , "") : message
    }
}

require('./app/Console/kernel')();
