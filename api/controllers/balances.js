const _ = require('lodash');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const Balance = require('../models/balances');
const Transaction = require('../models/transactions');

const logger = createLogger({
    format: combine(
        label({ label: 'Balances' }),
        timestamp(),
        prettyPrint()
    ),
    transports: [
        new transports.File({ filename: 'log/error.log', level: 'error'}),
        new transports.File({ filename: 'log/combined.log'})
    ]
})

exports.get = async (req, res, next) => {
    let query = req.query;
    let balance = await getBalance(query);

    res.status(200).json({
        results: {
            query_params: req.query,
            data: balance
        }
    });
}

exports.force = async (req, res, next) => {
    let query = req.query;
    let balance = await makeBalance(query)

    res.status(200).json({
        results: {
            query_params: req.query,
            data: balance
        }
    })
}

async function getBalance(query) {
    let criteria = {};
    if (!_.isEmpty(query)) {
        if (!_.isUndefined(query.internal_number) && !_.isEmpty(query.internal_number)) {
            criteria.internal_number = query.internal_number
        }
    } else {
        return false;
    }

    let balance = await Balance.find(criteria)
        .then(result => { return result; })
        .catch(err => {
            console.log(err)

            let message = {
                message: "Something went wrong",
                error: err.message,
                data: query
            }

            logger.error(message)
        });

    return balance;
}

async function makeBalance(query) {
    let balance = await Transaction.aggregate([
        {
            $match : {
                $and: [
                    { internal_number: parseInt(query.internal_number) },
                    { operation_type: { $ne: "venta" } }
                ]
            }
        },
        {
            $sort: { date: -1 }
        },
        {
            $project: {
                _id: 1,
                number: "$internal_number",
                amount: {
                    $cond: [
                        {
                            $eq: [
                                "$operation_type", "carga"
                            ]
                        },
                        "$amount", { $multiply: [ -1, "$amount" ] }
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$number",
                balance: { $sum: "$amount" },
                total_transactions: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                internal_number: "$_id",
                balance: "$balance",
                transactions: "$total_transactions"
            }
        }
    ])
        .then(result => { return result; })
        .catch(err => {
            let message = {
                message: "Something went wrong",
                error: err.message,
                data: query
            }

            logger.error(message)
        });

    if (!_.isUndefined(balance[0])) {
        await Balance.findOneAndUpdate(
            {internal_number: parseInt(query.internal_number)},
            balance[0],
            {new: true, upsert: true}
        )
            .catch(err => {
                let message = {
                    message: "Something went wrong",
                    error: err.message,
                    data: {
                        query: query,
                        balance: balance
                    }
                }

                logger.error(message)
            })

        return balance
    } else {
        let message = {
            message: "Something went wrong",
            error: "The balance for the internal number given is not available",
            data: {
                query: query
            }
        };

        logger.error(message);

        return false
    }
}