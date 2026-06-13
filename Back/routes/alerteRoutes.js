const express = require('express');
const router = express.Router();
const alerteController = require('../controllers/alerteController');

// Routes protégées par le middleware d'authentification

// Créer une alerte manuellement
router.post('/', alerteController.createAlert);

// Récupérer toutes les alertes
router.get('/', alerteController.getAllAlerts);

// Récupérer les alertes d'un véhicule spécifique
router.get('/:vehicleId', alerteController.getVehicleAlerts);

// Mettre à jour le statut d'une alerte
router.put('/:alertId/status', alerteController.updateAlertStatus);

// Marquer toutes les alertes comme lues
router.put('/mark-all-read', alerteController.markAllAsRead);

module.exports = router;