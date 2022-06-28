const _ = require('lodash');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const Transaction = require('../models/transactions')

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

    res.status(200).json({
        results: {
            query_params: req.query,
            data: transactions[0],
            page: Number.parseInt(page),
            total: transactions[1]
        }
    });
}

exports.add = async (req, res, next) => {
    let transaction = await saveTransaction(req.body);
    console.log(transaction._id);

    res.status(200).json({
        success: true
    });
}

async function saveTransaction(data) {
    let transaction = new Transaction(data);
    return transaction.save()
        .then(result => { return result })
        .catch(err => console.log(err));
}

async function getTransactions(query, skip = 1, limit = 32) {
    let criteria = {};
    if (!_.isEmpty(query)) {
        if (!_.isUndefined(query.name_station)) {
            criteria.name_station = query.name_station;
        }
        if (!_.isUndefined(query.fare)) {
            criteria.fare = _.escape(query.fare);
        }
        if (!_.isUndefined(query.operation_type)) {
            criteria.operation_type = query.operation_type;
        }

        if (!_.isUndefined(query.date)) {
            let startDate = new Date(query.date);
            let endDate = new Date(query.date);
            endDate.setDate(startDate.getDate()+1);

            criteria.date = { $gte: startDate, $lt: endDate };
        }
    }

    let totalTransactions = await Transaction.find(criteria)
        .countDocuments()
        .then(result => { return result; })
        .catch(err => console.log(err));

    let transactions = await Transaction.find(criteria)
        .sort({date: 'desc'})
        .skip(skip)
        .limit(limit)
        .then(result => { return result; })
        .catch(err => console.log(err));

    return [transactions, _.ceil((totalTransactions/limit), 0) ];
}