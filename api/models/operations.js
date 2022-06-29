const mongoose = require('mongoose');

const operationsSchema = new mongoose.Schema({
    type: {
        type: String,
    }
}, {
    timestamps: false
});

const Operations = mongoose.model('Operations', operationsSchema);
module.exports = Operations;