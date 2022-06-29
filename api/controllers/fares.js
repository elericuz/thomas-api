const jwt = require('jsonwebtoken');
const Fares = require('../models/fares')

exports.list = async (req, res, next) => {
    let fares = await list();

    res.status(200).json({
        results: {
            data: fares
        }
    });
}

async function list() {
    let fares = await Fares.find()
        .sort({fare: 'asc'})
        .then(result => { return result; })
        .catch(err => console.log(err));

    return fares;
}