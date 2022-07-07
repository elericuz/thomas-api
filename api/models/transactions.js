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
    terminal: {
        type: String,
    },
    operation_type: {
        type: String,
    },
    external_number: {
        type: String,
    },
    internal_number: {
        type: Number,
        default: 0
    },
    card_transaction_number: {
        type: Number,
        default: 0
    },
    former_purse: {
        type: Number,
        default: 0
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
    document_id: {
        type: String,
        default: "0",
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