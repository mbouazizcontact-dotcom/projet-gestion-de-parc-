const express = require('express');
const router = express.Router();
const mecaniciensController = require('../controllers/mecanicienController');

// Routes for mechanics
router.get('/', mecaniciensController.getAllMecaniciens);
router.get('/:id', mecaniciensController.getMecanicienById);
router.post('/', mecaniciensController.createMecanicien);
router.put('/:id', mecaniciensController.updateMecanicien);
router.delete('/:id', mecaniciensController.deleteMecanicien);

module.exports = router;