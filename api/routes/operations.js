const express = require('express');
const router = express.Router();

const OperationsController = require('../controllers/operations')

router.get('/list', OperationsController.list)

module.exports = router;