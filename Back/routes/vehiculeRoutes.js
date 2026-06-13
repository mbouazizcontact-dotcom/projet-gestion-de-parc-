const express = require('express');
const router = express.Router();
const { 
  createVehicule, 
  getAllVehicules,
  getVehiculeById,
  updateVehicule,
  deleteVehicule 
} = require('../controllers/vehiculeController');

router.post('/', createVehicule);
router.get('/all', getAllVehicules);
router.get('/:id', getVehiculeById);
router.put('/:id', updateVehicule);
router.delete('/:id', deleteVehicule);

module.exports = router;