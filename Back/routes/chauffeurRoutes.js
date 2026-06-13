const express = require('express');
const driverController = require('../controllers/Chauffeur');
const router = express.Router();

router.post('/drivers', driverController.addDriver);
router.get('/drivers', driverController.getAllDrivers);
router.get('/drivers/:id', driverController.getDriverById);
router.put('/drivers/:id', driverController.updateDriver);
router.delete('/drivers/:id', driverController.deleteDriver);
router.get('/drivers/:id/vehicles', driverController.getDriverVehicles);

module.exports = router;