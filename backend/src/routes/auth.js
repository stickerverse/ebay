const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/configure-ebay', authMiddleware, authController.configureEbay);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
