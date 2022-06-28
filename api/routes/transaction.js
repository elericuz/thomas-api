const express = require('express');
const router = express.Router();

const TransactionController = require('../controllers/transaction')

router.get('/get', TransactionController.get)
router.post('/add', TransactionController.add);

module.exports = router;