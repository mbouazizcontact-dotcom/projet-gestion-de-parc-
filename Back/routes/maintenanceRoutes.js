const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');

router.post('/maintenances',maintenanceController.createMaintenance);
router.get('/maintenances', maintenanceController.getAllMaintenances);
router.get('/maintenances/:id',  maintenanceController.getMaintenanceById);
router.put('/maintenances/:id',  maintenanceController.updateMaintenance);
router.put('/maintenancesStatus/:id',  maintenanceController.updateMaintenanceStatus);
router.delete('/maintenances/:id',  maintenanceController.deleteMaintenance);
router.get('/vehicles/:vehicleId', maintenanceController.getMaintenancesByVehicle);
module.exports = router;