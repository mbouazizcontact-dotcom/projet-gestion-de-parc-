const express = require('express');
const router = express.Router();
const reclamationController = require('../controllers/ReclamationController');

router.post('/', reclamationController.createReclamation);
router.get('/', reclamationController.getAllReclamations);
router.get('/:id', reclamationController.getReclamationById);
router.patch('/:id/status', reclamationController.updateReclamationStatus);

module.exports = router;