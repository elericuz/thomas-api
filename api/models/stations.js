const mongoose = require('mongoose');

const stationsSchema = new mongoose.Schema({
    name: {
        type: String,
    }
}, {
    timestamps: false
});

const Stations = mongoose.model('Stations', stationsSchema);
module.exports = Stations;