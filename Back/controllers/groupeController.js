const Groupe = require('../models/groupe');
const Vehicule = require('../models/Vehicule');

exports.createGroupe = async (req, res) => {
  try {
    const { nom } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du groupe est requis',
      });
    }

    const groupe = new Groupe({
      nom: nom.trim(),
      nombreConducteurs: 0,
      nombreVehiculesFonctionnels: 0,
      nombreVehiculesAccidentes: 0,
      nombreVehiculesStock: 0,
      nombreVehiculesReparation: 0,
      nombreTotalVehicules: 0,
    });

    const savedGroupe = await groupe.save();
    await savedGroupe.updateCounts(); // Update numerical fields based on Vehicule data

    res.status(201).json({
      success: true,
      data: savedGroupe,
      message: 'Groupe créé avec succès',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un groupe avec ce nom existe déjà',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du groupe',
      error: error.message,
    });
  }
};


exports.getAllGroupes = async (req, res) => {
  try {
    const groupes = await Groupe.find();
    res.status(200).json({
      success: true,
      data: groupes,
      count: groupes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des groupes',
      error: error.message,
    });
  }
};


exports.getGroupeById = async (req, res) => {
  try {
    const groupe = await Groupe.findById(req.params.id);
    if (!groupe) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé',
      });
    }
    res.status(200).json({
      success: true,
      data: groupe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du groupe',
      error: error.message,
    });
  }
};


exports.updateGroupe = async (req, res) => {
  try {
    const groupe = await Groupe.findById(req.params.id);
    if (!groupe) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé',
      });
    }

    const { nom } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du groupe est requis',
      });
    }

    const updatedData = {
      nom: nom.trim(),
    };

    const updatedGroupe = await Groupe.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    await updatedGroupe.updateCounts(); // Update numerical fields based on Vehicule data

    res.status(200).json({
      success: true,
      data: updatedGroupe,
      message: 'Groupe mis à jour avec succès',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un groupe avec ce nom existe déjà',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du groupe',
      error: error.message,
    });
  }
};


exports.deleteGroupe = async (req, res) => {
  try {
    const groupe = await Groupe.findById(req.params.id);
    if (!groupe) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé',
      });
    }

    const vehicleCount = await Vehicule.countDocuments({ proprietaire: groupe._id });
    if (vehicleCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer le groupe car il contient des véhicules. Veuillez d\'abord réaffecter ou supprimer ces véhicules.',
      });
    }

    await Groupe.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Groupe supprimé avec succès',
    });
  } catch (error) {
    console.error("Erreur de suppression:", error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du groupe',
      error: error.message,
    });
  }
};


exports.updateGroupeCounts = async (req, res) => {
  try {
    const groupe = await Groupe.findById(req.params.id);
    if (!groupe) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé',
      });
    }

    await groupe.updateCounts();
    const updatedGroupe = await Groupe.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedGroupe,
      message: 'Statistiques du groupe mises à jour avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des statistiques',
      error: error.message,
    });
  }
};


exports.syncAllGroupes = async (req, res) => {
  try {
    const vehicules = await Vehicule.find().populate('proprietaire');

    // Agréger les statistiques par groupe
    const groupStats = vehicules.reduce((acc, vehicule) => {
      const groupId = vehicule.proprietaire?._id;
      if (!groupId) return acc;

      if (!acc[groupId]) {
        acc[groupId] = {
          nom: vehicule.proprietaire.nom,
          nombreConducteurs: new Set(),
          nombreVehiculesFonctionnels: 0,
          nombreVehiculesAccidentes: 0,
          nombreVehiculesStock: 0,
          nombreVehiculesReparation: 0,
          nombreTotalVehicules: 0,
        };
      }

      acc[groupId].nombreTotalVehicules += 1;
      if (vehicule.conducteur) acc[groupId].nombreConducteurs.add(vehicule.conducteur.toString());
      switch (vehicule.etat) {
        case 'Fonctionnel':
          acc[groupId].nombreVehiculesFonctionnels += 1;
          break;
        case 'Accidenté':
          acc[groupId].nombreVehiculesAccidentes += 1;
          break;
        case 'stock':
          acc[groupId].nombreVehiculesStock += 1;
          break;
        case 'Reparation':
          acc[groupId].nombreVehiculesReparation += 1;
          break;
      }
      return acc;
    }, {});

    // Mettre à jour ou insérer les groupes dans la base
    for (const [groupId, stats] of Object.entries(groupStats)) {
      await Groupe.updateOne(
        { _id: groupId },
        {
          $set: {
            nom: stats.nom,
            nombreConducteurs: stats.nombreConducteurs.size,
            nombreVehiculesFonctionnels: stats.nombreVehiculesFonctionnels,
            nombreVehiculesAccidentes: stats.nombreVehiculesAccidentes,
            nombreVehiculesStock: stats.nombreVehiculesStock,
            nombreVehiculesReparation: stats.nombreVehiculesReparation,
            nombreTotalVehicules: stats.nombreTotalVehicules,
          },
        },
        { upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Tous les groupes ont été synchronisés avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation des groupes',
      error: error.message,
    });
  }
};