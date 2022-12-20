const express = require('express');
const router = express.Router();

const TransactionController = require('../controllers/transaction')

router.get('/', TransactionController.list)
router.get('/get', TransactionController.get)
router.post('/add', TransactionController.add);
router.get('/brief', TransactionController.brief);

module.exports = router;