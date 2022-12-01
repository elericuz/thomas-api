const _ = require('lodash');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const Transaction = require('../models/transactions')
const Balance = require('../models/balances')

const logger = createLogger({
    format: combine(
        label({ label: 'Transactions' }),
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
    let page = query.page;
    if (_.isUndefined(page) || !Number.isInteger(page*1)) {
        page = 1;
    }

    let limit = query.limit;
    if (_.isUndefined(limit) || !Number.isInteger(limit*1)) {
        limit = 32;
    }

    const skip = (page === 1) ? 0 : (limit * (page-1));

    delete query.page;
    delete query.limit;

    let transactions = await getTransactions(query, skip, Number.parseInt(limit));

    let options = {
        timeZone: 'America/Lima'
    }

    var items = transactions[0].map(function(item) {
        item.date = new Date(item.date).toLocaleString('en-US', options);
        item.createdAt = new Date(item.createdAt).toLocaleString('en-US', options);
        item.updatedAt = new Date(item.updatedAt).toLocaleString('en-US', options);

        return item
    })

    let total = transactions[1]

    res.status(200).json({
        results: {
            query_params: req.query,
            data: items,
            page: Number.parseInt(page),
            total: total
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

async function updateBalance(internalNumber, operationType, amount) {
    let purse = operationType == "uso" ? -amount : amount

    let balance = await Balance.findOne({
        internal_number: internalNumber
    })
    .then( result => { return result })
    .catch((err => console.log(result)))

    if (_.isNull(balance)) {
        let newBalance = {
            internal_number: internalNumber,
            balance: amount,
            transactions: 1
        }

        return await new Balance(newBalance)
            .save()
            .then( result => { return result })
            .catch(err => console.log(err))
    } else {
        let newBalance = parseFloat(balance.balance) + parseFloat(purse)
        let transactions = parseInt(balance.transactions) + 1

        let data = { internal_number: internalNumber, balance: newBalance, transactions: transactions }

        return await Balance.findByIdAndUpdate(balance._id, data)
            .then( result => {
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
            let balance = await updateBalance(data.internal_number, data.operation_type, data.amount)

            logger.info({
                message: "Transaction added",
                id: result._id,
                data: {
                    internal_number: data.internal_number,
                    operation_type: data.operation_type,
                    date: data.date,
                    amount: data.amount,
                    balance: balance
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

async function getTransactions(query, skip = 1, limit = 32) {
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
            endDate.setDate(startDate.getDate()+1);

            criteria.date = { $gte: startDate, $lt: endDate };
        }
    }

    let transactions = await Transaction.find(criteria)
        .sort({date: 'desc'})
        .skip(skip)
        .limit(limit)
        .then(result => { return result; })
        .catch(err => console.log(err));

    let totalTransactions = await Transaction.estimatedDocumentCount()
        .then(result => { return result; })
        .catch(err => console.log(err));

    return [transactions, _.ceil((totalTransactions/limit), 0) ];
}