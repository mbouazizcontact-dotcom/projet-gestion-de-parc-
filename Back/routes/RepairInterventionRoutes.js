const express = require('express');
const router = express.Router();
const repairInterventionController = require('../controllers/repairInterventionController');

// Routes for repair interventions
router.post('/', repairInterventionController.createRepairIntervention);
router.get('/', repairInterventionController.getAllRepairInterventions);
router.get('/:id', repairInterventionController.getRepairInterventionById);
router.delete('/:id', repairInterventionController.deleteRepairIntervention); 

module.exports = router;