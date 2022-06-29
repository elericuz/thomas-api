const jwt = require('jsonwebtoken');
const Operations = require('../models/operations')

exports.list = async (req, res, next) => {
    let operations = await list();

    res.status(200).json({
        results: {
            data: operations
        }
    });
}

async function list() {
    let operations = await Operations.find()
        .sort({type: 'asc'})
        .then(result => { return result; })
        .catch(err => console.log(err));

    return operations;
}