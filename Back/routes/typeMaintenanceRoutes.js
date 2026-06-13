const express = require('express');
const router = express.Router();
const typeMaintenanceController = require('../controllers/typeMaintenanceController');

// Types de maintenance
router.post('/types', typeMaintenanceController.createTypeMaintenance);
router.get('/types', typeMaintenanceController.getAllTypeMaintenances);
router.get('/types/:id', typeMaintenanceController.getTypeMaintenanceById);
router.put('/types/:id', typeMaintenanceController.updateTypeMaintenance);
router.delete('/types/:id', typeMaintenanceController.deleteTypeMaintenance);




module.exports = router;