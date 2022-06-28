const morgan = require('morgan');
const express = require('express');
const moment = require('moment');
const lodash = require('lodash');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// App
const app = express();

app.use(cookieParser());

// morgan to log
app.use(morgan('dev'));

// moment as middleware
app.use((req, res, next) => {
    res.locals.moment = moment;
    res.locals._ = lodash;
    next();
})

// token to the whole site
app.use((req, res, next) => {
    let token = req.cookies.userToken;
    if (!lodash.isUndefined(token) && !lodash.isNull(token)) {
        let tokenDecoded = jwt.decode(token);
        res.locals.user = {
            name: tokenDecoded.name + " " + tokenDecoded.lastname,
            email_address: tokenDecoded.email_address
        };
    }
    next();
})

//static files
app.use(express.static('public'));

//urlencode
app.use(express.urlencoded({ extended: true }));

const transactionRoutes = require('./api/routes/transaction');
app.use('/transactions', transactionRoutes);

// error page
app.use((req, res) => {
    res.status(404).json({"error": '404'})
})

module.exports = app;