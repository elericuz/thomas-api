const mongoose = require('mongoose');

const faresSchema = new mongoose.Schema({
    fare: {
        type: String,
    }
}, {
    timestamps: false
});

const Fares = mongoose.model('Fares', faresSchema);
module.exports = Fares;