const express = require('express');
const router = express.Router();
const receptionFicheController = require('../controllers/receptionFicheController');

// Create a new reception fiche
router.post('/reception-fiche', receptionFicheController.createReceptionFiche);

// Get all reception fiches
router.get("/reception-fiche", receptionFicheController.getAllReceptionFiches);

// Get a single reception fiche by ID
router.get("/reception-fiche/:id", receptionFicheController.getReceptionFicheById);

// Delete a reception fiche by ID
router.delete("/reception-fiche/:id", receptionFicheController.deleteReceptionFiche);

// Upload image endpoint
router.post("/upload-image", receptionFicheController.uploadImage);

router.post("/reception-fiche/request-parts", receptionFicheController.requestParts);


module.exports = router;