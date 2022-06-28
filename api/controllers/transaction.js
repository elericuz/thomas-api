const _ = require('lodash');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const Transaction = require('../models/transactions')

exports.add = async (req, res, next) => {
    let transaction = await saveTransaction(req.body);
    console.log(transaction._id)

    res.status(200).json({
        data: "yes"
    });
}

async function saveTransaction(data) {
    let transaction = new Transaction(data);
    return transaction.save()
        .then(result => { return result })
        .catch(err => console.log(err));
}