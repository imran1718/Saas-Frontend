const express = require('express');
const authRoutes = require('./auth.routes');
const roleRoutes = require('./role.routes');
const permissionRoutes = require('./permission.routes');
const platformAuthRoutes = require('./platformAuth.routes');
const impersonationRoutes = require('./impersonation.routes');
const companyProfileRoutes = require('./companyProfile.routes');
const pickupAddressRoutes = require('./pickupAddress.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/platform/auth', platformAuthRoutes);
router.use('/platform/impersonate', impersonationRoutes);
router.use('/company/profile', companyProfileRoutes); // Covers /profile and /documents based on routes logic
router.use('/addresses', pickupAddressRoutes);

// Other modules will be mounted here
// router.use('/orders', orderRoutes);
// router.use('/shipments', shipmentRoutes);

module.exports = router;
