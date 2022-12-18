'use strict';
require('dotenv').config();

// Constants
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.DEFAULT_PORT;
const HOST = '0.0.0.0';

const server = http.createServer(app);

// connect mongodb
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

let dbUri = "mongodb://" + process.env.MONGO_USER + ":" + process.env.MONGO_PASSWORD + "@" + process.env.MONGO_SERVER + "/" + process.env.MONGO_PORT + "?authSource=admin&retryWrites=true&w=1"
if (process.env.ENVIRONMENT == "DEVELOPMENT") {
    dbUri = "mongodb://" + process.env.MONGO_USER_DEV + ":" + process.env.MONGO_PASSWORD_DEV + "@" + process.env.MONGO_SERVER_DEV + "/" + process.env.MONGO_DB_DEV + "?authSource=admin&retryWrites=true&w=1"
}

mongoose.connect(dbUri, {useNewUrlParser: true, useUnifiedTopology: true})
    .then((result) => {
        server.listen(PORT, HOST)
    })
    .catch((err) => console.log(err));

console.log(`Running on https://${HOST}:${PORT}`);