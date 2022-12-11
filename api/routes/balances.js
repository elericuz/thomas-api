const express = require('express');
const router = express.Router();

const BalancesController = require('../controllers/balances')

router.get('/get', BalancesController.get);
router.get('/force', BalancesController.force);

module.exports = router;