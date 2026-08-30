const express = require('express');
const router  = express.Router();
const { getManagerNotifications } = require('../controllers/managerNotificationsController');
const { verifyToken, adminOrManager } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', adminOrManager, getManagerNotifications);

module.exports = router;
