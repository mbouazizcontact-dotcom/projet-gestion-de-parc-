// const Maintenance = require('../models/demandeMaintenance');

// exports.getAllMaintenances = async (req, res) => {
//   try {
//     const maintenances = await Maintenance.find()
//       .populate('chauffeur', 'nom prenom email telephone')
//       .populate('vehicule', 'immatriculation marque modele')
//       .populate('mecanicien', 'nom prenom email telephone qualifications'); 

//     res.status(200).json(maintenances);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.getMaintenanceById = async (req, res) => {
//   try {
//     const maintenance = await Maintenance.findById(req.params.id)
//       .populate('chauffeur', 'nom prenom email telephone')
//       .populate('vehicule', 'immatriculation marque modele')
//       .populate('mecanicien', 'nom prenom email telephone qualifications');

//     if (!maintenance) return res.status(404).json({ message: 'Maintenance non trouvée' });

//     res.status(200).json(maintenance);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.createMaintenance = async (req, res) => {
//   try {
//     const { chauffeur, vehicule, mecanicien, symptomes_panne, dateDepot, etat, date_prevue_remise } = req.body;

//     const newMaintenance = new Maintenance({ 
//       chauffeur, 
//       vehicule, 
//       mecanicien, 
//       symptomes_panne, 
//       dateDepot, 
//       etat, 
//       date_prevue_remise 
//     });

//     await newMaintenance.save();
//     res.status(201).json(newMaintenance);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.updateMaintenanceStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { etat } = req.body;

//     if (!['En attente', 'En cours', 'Terminé'].includes(etat)) {
//       return res.status(400).json({ message: "État invalide" });
//     }

//     const maintenance = await Maintenance.findByIdAndUpdate(
//       id, 
//       { etat }, 
//       { new: true, runValidators: true }
//     ).populate('chauffeur vehicule mecanicien');

//     if (!maintenance) {
//       return res.status(404).json({ message: "Maintenance non trouvée" });
//     }

//     res.status(200).json(maintenance);
//   } catch (error) {
//     res.status(500).json({ message: "Erreur lors de la mise à jour du statut", error: error.message });
//   }
// };

// exports.deleteMaintenance = async (req, res) => {
//   try {
//     const deletedMaintenance = await Maintenance.findByIdAndDelete(req.params.id);
//     if (!deletedMaintenance) return res.status(404).json({ message: 'Maintenance non trouvée' });
//     res.status(200).json({ message: 'Maintenance supprimée' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
