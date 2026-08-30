const express = require('express');
const router  = express.Router();
const { getStorekeeperNotifications } = require('../controllers/storekeeperNotificationsController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', getStorekeeperNotifications);

module.exports = router;
