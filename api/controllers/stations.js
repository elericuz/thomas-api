const jwt = require('jsonwebtoken');
const Stations = require('../models/stations')

exports.list = async (req, res, next) => {
    let stations = await listStations();

    res.status(200).json({
        results: {
            data: stations
        }
    });
}

async function listStations() {
    let stations = await Stations.find()
        .sort({name: 'asc'})
        .then(result => { return result; })
        .catch(err => console.log(err));

    return stations;
}