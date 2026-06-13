// routes/groupe.routes.js
const express = require('express');
const router = express.Router();
const groupeController = require('../controllers/groupeController');

router.post('/', groupeController.createGroupe);
router.get('/', groupeController.getAllGroupes);
router.get('/:id', groupeController.getGroupeById);
router.put('/:id', groupeController.updateGroupe);
router.delete('/:id', groupeController.deleteGroupe);
router.put('/:id/update-counts', groupeController.updateGroupeCounts);
router.post('/sync', groupeController.syncAllGroupes);

module.exports = router;