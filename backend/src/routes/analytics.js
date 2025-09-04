const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.get('/stats', analyticsController.getStats);
router.get('/chart/:type', analyticsController.getChartData);

module.exports = router;
