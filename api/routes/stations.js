const express = require('express');
const router = express.Router();

const StationController = require('../controllers/stations')

router.get('/list', StationController.list)

module.exports = router;