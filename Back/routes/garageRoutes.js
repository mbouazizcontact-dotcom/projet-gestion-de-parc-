const express = require('express');
const router = express.Router();
const garageController = require('../controllers/garageController');

// Routes pour les garages
router.post('/', garageController.createGarage); // Créer un garage
router.get('/', garageController.getAllGarages); // Obtenir tous les garages
router.get('/:id', garageController.getGarageById); // Obtenir un garage par ID
router.put('/:id', garageController.updateGarage); // Mettre à jour un garage
router.delete('/:id', garageController.deleteGarage); // Supprimer un garage

module.exports = router;