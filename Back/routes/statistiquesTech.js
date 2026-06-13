const express = require('express');
const router = express.Router();
const stat = require('../controllers/statistiquesControllerTech')

// Route pour récupérer les statistiques
router.get('/statistiques',stat.getStatistiques);

module.exports = router;
