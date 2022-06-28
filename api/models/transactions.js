const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    name_station: {
        type: String,
    },
    reference_id: {
        type: String,
    },
    operation_type: {
        type: String,
    },
    sw_serial_number: {
        type: String,
    },
    media_serial_number: {
        type: String,
    },
    amount: {
        type: Number,
        default: 0,
        required: true
    },
    purse: {
        type: Number,
        default: 0,
        required: true
    },
    fare: {
        type: String,
    }
}, {
    timestamps: true
});

const Transaction = mongoose.model('Transactions', transactionSchema);
module.exports = Transaction;