const express = require('express');
const c = require('../controllers/storefrontConnection.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', c.listConnections);
router.post('/', c.connectStorefront);
router.get('/:id', c.getConnection);
router.put('/:id', c.updateConnection);
router.delete('/:id', c.disconnectStorefront);
router.post('/:id/sync', c.triggerSync);
router.get('/:id/logs', c.getSyncLogs);

module.exports = router;
