const _ = require('lodash');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const {createLogger, format, transports} = require('winston');
const {combine, timestamp, label, prettyPrint} = format;
const Transaction = require('../models/transactions')
const Balance = require('../models/balances')
const {isNumber} = require('../helpers/utils');

const logger = createLogger({
    format: combine(
        label({label: 'Transactions'}),
        timestamp(),
        prettyPrint()
    ),
    transports: [
        new transports.File({filename: 'log/error.log', level: 'error'}),
        new transports.File({filename: 'log/combined.log'})
    ]
})

exports.get = async (req, res, next) => {
    let query = req.query;
    let limit = _.isUndefined(query.limit) ? 16 : query.limit;
    limit = (!isNumber(limit)) ? 32 : _.parseInt(limit);
    let page = _.isUndefined(query.page) ? 1 : query.page;
    page = (!isNumber(page)) ? 1 : _.parseInt(page);

    const skip = (page === 1) ? 0 : (limit * (page - 1));

    let transactions = await getTransaction(query, skip, limit);

    res.status(200).json({
        results: {
            query_params: req.query,
            data: {
                card_info: transactions[0].card_info,
                transactions: transactions[0].transactions,
                balance: transactions[0].balance,
                total: transactions[0].total[0].count,
                page: Number.parseInt(page),
                totalPages: _.ceil(transactions[0].total[0].count / limit)
            }
        }
    })
}

exports.list = async (req, res, next) => {
    let query = req.query;
    let page = query.page;
    if (_.isUndefined(page) || !Number.isInteger(page * 1)) {
        page = 1;
    }

    let limit = query.limit;
    if (_.isUndefined(limit) || !Number.isInteger(limit * 1)) {
        limit = 32;
    }

    const skip = (page === 1) ? 0 : (limit * (page - 1));

    delete query.page;
    delete query.limit;

    let transactions = await listTransactions(query, skip, Number.parseInt(limit));

    let options = {
        timeZone: 'America/Lima'
    }

    var items = transactions[0].map(function (item) {
        item.date = new Date(item.date).toLocaleString('en-US', options);
        item.createdAt = new Date(item.createdAt).toLocaleString('en-US', options);
        item.updatedAt = new Date(item.updatedAt).toLocaleString('en-US', options);

        return item
    })

    let total = transactions[1]
    let totalPages = transactions[2]

    res.status(200).json({
        results: {
            query_params: req.query,
            data: items,
            total: total,
            page: Number.parseInt(page),
            totalPages: totalPages
        }
    });
}

exports.add = async (req, res, next) => {
    let transaction = await saveTransaction(req.body);
    try {
        console.log(transaction._id);
    } catch (e) {
        console.log(req.body);
        console.log("======== END OF THE ISSUE ========")
    }

    res.status(200).json({
        success: true
    });
}

exports.brief = async (req, res, next) => {
    let startDate = moment().tz('America/Lima')
        .subtract(5, 'minute')
        .startOf('minute')
        .format()
    let endDate = moment().tz('America/Lima')
        .endOf('minute')
        .format()

    console.log(startDate);
    console.log(_.toString(startDate));

    let brief = await getBrief(_.toString(startDate), _.toString(endDate));

    if (_.isEmpty(brief)) {
        brief = [
            {
                by_station: [],
                by_fare: [],
                by_type: []
            }
        ]
    }

    res.status(200).json({
        results: {
            startDate: startDate,
            endDate: endDate,
            data: brief
        }
    })
}

async function updateBalance(internalNumber, operationType, amount) {
    let purse = operationType === "uso" ? -amount : amount

    let balance = await Balance.findOne({
        internal_number: internalNumber
    })
        .then(result => {
            return result
        })
        .catch((err => console.log(err)))

    if (_.isNull(balance)) {
        let newBalance = {
            internal_number: internalNumber,
            balance: amount,
            transactions: 1
        }

        return await new Balance(newBalance)
            .save()
            .then(result => {
                return result
            })
            .catch(err => console.log(err))
    } else {
        let newBalance = parseFloat(balance.balance) + parseFloat(purse)
        let transactions = parseInt(balance.transactions) + 1

        let data = {internal_number: internalNumber, balance: newBalance, transactions: transactions}

        return await Balance.findByIdAndUpdate(balance._id, data)
            .then(result => {
                result.balance = newBalance
                result.transactions = transactions

                return result
            })
            .catch(err => {
                let message = {
                    message: "Something went wrong. We couldn't update the balance",
                    error: err.message,
                    data: data
                }

                logger.error(message)
            })
    }
}

async function saveTransaction(data) {
    let transaction = new Transaction(data);

    return transaction.save()
        .then(async result => {
            let balance = data.operation_type === "venta" ? 0 : await updateBalance(data.internal_number, data.operation_type, data.amount)

            logger.info({
                message: "Transaction added",
                data: {
                    id: result._id,
                    internal_number: data.internal_number,
                    operation_type: data.operation_type,
                    date: data.date,
                    amount: data.amount,
                    balance: balance,
                    json_file: result.json_file
                }
            })

            return result
        })
        .catch(err => {
            console.log("======== BEGGINING OF THE ISSUE ========")
            console.log("Something went wrong")
            console.log(err.message)

            let message = {
                message: "Something went wrong",
                error: err.message,
                data: data
            }

            logger.error(message)
        });
}

async function listTransactions(query, skip = 1, limit = 32) {
    let criteria = {};
    if (!_.isEmpty(query)) {
        if (!_.isUndefined(query.name_station) && !_.isEmpty(query.name_station)) {
            criteria.name_station = query.name_station;
        }
        if (!_.isUndefined(query.fare) && !_.isEmpty(query.fare)) {
            criteria.fare = _.escape(query.fare);
        }
        if (!_.isUndefined(query.operation_type) && !_.isEmpty(query.operation_type)) {
            criteria.operation_type = query.operation_type;
        }
        if (!_.isUndefined(query.external_number) && !_.isEmpty(query.external_number)) {
            criteria.external_number = query.external_number
        }
        if (!_.isUndefined(query.document_id) && !_.isEmpty(query.document_id)) {
            criteria.document_id = query.document_id;
        }

        if (!_.isUndefined(query.date) && !_.isEmpty(query.date)) {
            let startDate = new Date(query.date);
            let endDate = new Date(query.date);
            endDate.setDate(startDate.getDate() + 1);

            criteria.date = {$gte: startDate, $lt: endDate};
        }
    }

    let transactions = await Transaction.find(criteria)
        .sort({date: 'desc'})
        .skip(skip)
        .limit(limit)
        .then(result => {
            return result;
        })
        .catch(err => console.log(err));

    let totalTransactions = await Transaction.find(criteria).count()
        .then(result => {
            return result;
        })
        .catch(err => console.log(err));

    return [transactions, totalTransactions, _.ceil((totalTransactions / limit), 0)];
}

async function getTransaction(query, skip, limit) {
    return await Transaction.aggregate([
        {
            $match: {external_number: query.external_number}
        },
        {
            $facet: {
                "transactions": [
                    {
                        $sort: {date: -1}
                    },
                    {$skip: skip},
                    {$limit: limit}
                ],
                "card_info": [
                    {
                        $limit: 1
                    },
                    {
                        $project: {
                            _id: 0,
                            internal_number: "$internal_number",
                            external_number: "$external_number",
                            document_id: "$document_id"
                        }
                    }
                ],
                "total": [
                    {
                        $count: "count"
                    }
                ],
                "balance": [
                    {
                        $project: {
                            _id: 0,
                            number: "$internal_number",
                            carga: {
                                $cond: [
                                    {
                                        $eq: ["$operation_type", "carga"]
                                    },
                                    "$amount",
                                    {
                                        $cond: [
                                            {
                                                $eq: ["$operation_type", "uso"]
                                            },
                                            {$multiply: [-1, "$amount"]},
                                            0
                                        ]
                                    }
                                ]
                            },
                        }
                    },
                    {
                        $group: {
                            _id: "$number",
                            balance: {$sum: "$carga"},
                            total_transactions: {$sum: 1}
                        },
                    }
                ]
            }
        }
    ]).then(result => {
        return result;
    }).catch(err => {
        console.log(err);
    });
}

async function getBrief(startDate, endDate) {
    return await Transaction.aggregate([
        {
            $match: {
                date: {$gte: new Date(startDate), $lt: new Date(endDate)}
            }
        },
        {
            $facet: {
                "people_at_stations": [
                    {$match: {operation_type: "uso"}},
                    {
                        $group: {_id: "$name_station", count: {$sum: 1}, paid: {$sum: "$amount"}}
                    },
                    {
                        $sort: {count: -1}
                    },
                    {
                        $project: {
                            _id: 0,
                            station: "$_id",
                            total: "$count",
                            paid: "$paid"
                        }
                    }
                ],

                "people_by_fare": [
                    {$match: {operation_type: "uso"}},
                    {
                        $group: {_id: "$fare", count: {$sum: 1}, paid: {$sum: "$amount"}}
                    },
                    {
                        $sort: {count: -1}
                    },
                    {
                        $project: {
                            _id: 0,
                            fare: "$_id",
                            total: "$count",
                            paid: "$paid"
                        }
                    }
                ],
                "by_type": [
                    {
                        $group: {_id: "$operation_type", count: {$sum: 1}, paid: {$sum: "$amount"}}
                    },
                    {
                        $sort: {count: -1}
                    },
                    {
                        $project: {
                            _id: 0,
                            operation_type: "$_id",
                            total: "$count",
                            paid: "$paid"
                        }
                    }
                ],
                "total_people": [
                    {$match: {operation_type: "uso"}},
                    {
                        $group: {_id: null, count: {$sum: 1}}
                    },
                    {
                        $project: {
                            _id: 0,
                            total: "$count"
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$total_people"
        },
        {
            $project: {
                by_station: "$people_at_stations",
                by_fare: "$people_by_fare",
                by_type: "$by_type",
                total_people: "$total_people.total"
            }
        }
    ]).then(result => {
        return result;
    }).catch(err => {
        console.log(err);
    });
}