const express = require('express');
const router = express.Router();
const demandeController = require('../controllers/demandeController');

router.post('/demandes', demandeController.createDemande);
router.get('/demandes', demandeController.getAllDemandes);
router.get('/demandes/:id', demandeController.getDemandeById);
router.put('/demandes/:id/approve', demandeController.approveDemande);
router.put('/demandes/:id/reject', demandeController.rejectDemande);


module.exports = router;