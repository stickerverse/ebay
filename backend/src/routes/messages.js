const express = require('express');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.get('/sync', messageController.syncMessages);
router.get('/', messageController.getMessages);
router.post('/:messageId/respond', messageController.respondToMessage);

module.exports = router;
