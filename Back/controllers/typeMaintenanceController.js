
const TypeMaintenance = require('../models/typeMaintenance');

exports.createTypeMaintenance = async (req, res) => {
  try {
    const { nom, description, fréquence_recommandée, type_intervention, criticite } = req.body;

    if (!nom || !type_intervention) {
      return res.status(400).json({ message: 'Nom et type d\'intervention sont requis.' });
    }

    if (['Préventive', 'Périodique'].includes(type_intervention) && !fréquence_recommandée) {
      return res.status(400).json({ message: 'La fréquence est requise pour les maintenances préventives ou périodiques.' });
    }

    const typeMaintenance = new TypeMaintenance({
      nom,
      description,
      fréquence_recommandée: type_intervention === 'Corrective' ? undefined : fréquence_recommandée,
      type_intervention,
      criticite: criticite || 'moyenne',
    });

    await typeMaintenance.save();
    res.status(201).json(typeMaintenance);
  } catch (error) {
    console.error('Error creating type maintenance:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getAllTypeMaintenances = async (req, res) => {
  try {
    const types = await TypeMaintenance.find().sort({ nom: 1 });
    res.json(types);
  } catch (error) {
    console.error('Error fetching type maintenances:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTypeMaintenanceById = async (req, res) => {
  try {
    const typeMaintenance = await TypeMaintenance.findById(req.params.id);
    if (!typeMaintenance) {
      return res.status(404).json({ message: 'Type de maintenance non trouvé.' });
    }
    res.json(typeMaintenance);
  } catch (error) {
    console.error('Error fetching type maintenance:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateTypeMaintenance = async (req, res) => {
  try {
    const { nom, description, fréquence_recommandée, type_intervention, criticite } = req.body;

    if (!nom || !type_intervention) {
      return res.status(400).json({ message: 'Nom et type d\'intervention sont requis.' });
    }

    if (['Préventive', 'Périodique'].includes(type_intervention) && !fréquence_recommandée) {
      return res.status(400).json({ message: 'La fréquence est requise pour les maintenances préventives ou périodiques.' });
    }

    const updateData = {
      nom,
      description,
      fréquence_recommandée: type_intervention === 'Corrective' ? undefined : fréquence_recommandée,
      type_intervention,
      criticite: criticite || 'moyenne',
    };

    const typeMaintenance = await TypeMaintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!typeMaintenance) {
      return res.status(404).json({ message: 'Type de maintenance non trouvé.' });
    }

    res.json(typeMaintenance);
  } catch (error) {
    console.error('Error updating type maintenance:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTypeMaintenance = async (req, res) => {
  try {
    const typeMaintenance = await TypeMaintenance.findByIdAndDelete(req.params.id);
    if (!typeMaintenance) {
      return res.status(404).json({ message: 'Type de maintenance non trouvé.' });
    }
    res.json({ message: 'Type de maintenance supprimé avec succès.' });
  } catch (error) {
    console.error('Error deleting type maintenance:', error);
    res.status(500).json({ message: error.message });
  }
};