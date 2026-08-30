const express = require('express');
const router  = express.Router();
const { getAdminNotifications } = require('../controllers/notificationsController');
const { verifyToken, adminOnly } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', adminOnly, getAdminNotifications);

module.exports = router;
