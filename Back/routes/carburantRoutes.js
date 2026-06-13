const express = require('express');
const router = express.Router();
const carburantController = require('../controllers/carburantController');

// Routes pour la gestion du carburant
router.get('/', carburantController.getAllCarburant);
router.get('/:id', carburantController.getCarburantById);
router.post('/', carburantController.createCarburant);
router.put('/:id', carburantController.updateCarburant);
router.delete('/:id', carburantController.deleteCarburant);

module.exports = router; 