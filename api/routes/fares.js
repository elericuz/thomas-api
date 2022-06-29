const express = require('express');
const router = express.Router();

const FaresController = require('../controllers/fares')

router.get('/list', FaresController.list)

module.exports = router;