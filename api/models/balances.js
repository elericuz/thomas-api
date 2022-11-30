const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
    internal_number: {
        type: Number
    },
    balance: {
        type: Number
    },
    transactions: {
        type: Number
    }
}, {
    timestamps: true
});

const Balance = mongoose.model('Balance', balanceSchema);
module.exports = Balance;