const express = require('express');
const router = express.Router();


router.get('/' , function(req , res){

    return res.render('account_verify' , { code: "My Express App" , amount: "das"});

    // return res.send('Hey👋' + "<br>" + "Welcome to lottery base api" );
});


module.exports = router;
