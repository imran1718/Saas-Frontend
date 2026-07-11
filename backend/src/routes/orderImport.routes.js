const express = require('express');
const router = express.Router();
const orderImportController = require('../controllers/orderImport.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const can = require('../middlewares/can.middleware');
const { importUpload } = require('../middlewares/upload.middleware');

router.use(authenticate);

// Order Bulk Upload Routes
router.get('/template', can('order.bulk_upload'), orderImportController.downloadTemplate);
router.post('/bulk-import', can('order.bulk_upload'), importUpload.single('file'), orderImportController.bulkImport);
router.get('/imports', can('order.bulk_upload'), orderImportController.listImports);
router.get('/imports/:id', can('order.bulk_upload'), orderImportController.getImportById);

module.exports = router;
