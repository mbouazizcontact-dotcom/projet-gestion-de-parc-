const mongoose = require('mongoose');
const Vehicule = require('../models/Vehicule');
const multer = require('multer');
const path = require('path');
const { checkAndCreateAlertsForVehicle } = require('../utils/alerteUtils');
const { createVehicleUpdateNotification } = require('../utils/notificationUtils');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /zip|pdf/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers ZIP et PDF sont autorisés'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadMiddleware = upload.single('dossier');

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: `Erreur Multer: ${err.message}`,
      field: err.field,
    });
  }
  if (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
  next();
};


const updateVehicule = async (req, res) => {
  try {
    console.log('Requête reçue pour mettre à jour un véhicule:', {
      body: req.body,
      file: req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'Aucun fichier',
      params: req.params,
    });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "L'identifiant du véhicule est invalide",
      });
    }

    const existingVehicule = await Vehicule.findById(req.params.id);
    if (!existingVehicule) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    // Vérifier si c'est une mise à jour partielle du kilométrage uniquement
    const isMileageOnlyUpdate = req.body.kilometrage && Object.keys(req.body).length === 1;

    if (isMileageOnlyUpdate) {
      // Mise à jour partielle : seulement le kilométrage
      const km = Number(req.body.kilometrage);
      if (isNaN(km) || km < 0 || !Number.isInteger(km)) {
        return res.status(400).json({
          message: 'Le kilométrage doit être un nombre entier positif',
        });
      }

      const updateData = { kilometrage: km };

      const vehiculeUpdated = await Vehicule.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate('conducteur', 'nom prenom')
        .populate('proprietaire', 'nom');

      if (!vehiculeUpdated) {
        return res.status(404).json({ message: 'Véhicule non trouvé' });
      }

      // Créer une notification pour la mise à jour du kilométrage
      try {
        await createVehicleUpdateNotification(vehiculeUpdated, 'kilometrage', req.user ? req.user.id : null);
      } catch (notifError) {
        console.error('Erreur lors de la création de la notification:', notifError);
        // Ne pas échouer la requête si la notification échoue
      }

      // Vérifier les alertes si le kilométrage a changé
      console.log(`Kilométrage modifié pour ${vehiculeUpdated.marque} ${vehiculeUpdated.modele}: ${km} km`);
      try {
        const alertResult = await checkAndCreateAlertsForVehicle(vehiculeUpdated._id, km);
        console.log('Résultat de la vérification des alertes:', alertResult);
        if (alertResult.success && alertResult.alerts && alertResult.alerts.length > 0) {
          console.log(`${alertResult.alerts.length} nouvelles alertes créées pour le véhicule`);
        }
      } catch (alertError) {
        console.error('Erreur lors de la vérification des alertes:', alertError);
      }

      return res.status(200).json({
        message: 'Kilométrage mis à jour avec succès',
        vehicule: vehiculeUpdated,
      });
    }

    // Mise à jour complète : valider tous les champs requis
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'Le corps de la requête est vide ou mal formé',
      });
    }

    const {
      numero,
      marque,
      modele,
      immatriculation,
      mec,
      etat,
      proprietaire,
      numChassis,
      typeMines,
      kilometrage,
      conducteur,
    } = req.body;

    const requiredFields = [
      { key: 'marque', label: 'Marque' },
      { key: 'modele', label: 'Modèle' },
      { key: 'immatriculation', label: 'Immatriculation' },
      { key: 'mec', label: 'Date de mise en circulation' },
      { key: 'etat', label: 'État' },
      { key: 'proprietaire', label: 'Propriétaire' },
      { key: 'numChassis', label: 'Numéro de châssis' },
    ];

    const missingFields = requiredFields.filter(
      (field) => !req.body[field.key] || req.body[field.key] === ''
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Champs requis manquants : ${missingFields.map((f) => f.label).join(', ')}`,
      });
    }

    let km = existingVehicule.kilometrage;
    if (kilometrage !== undefined && kilometrage !== '') {
      km = Number(kilometrage);
      if (isNaN(km) || km < 0 || !Number.isInteger(km)) {
        return res.status(400).json({
          message: 'Le kilométrage doit être un nombre entier positif',
        });
      }
    }

    const mecDate = new Date(mec);
    if (isNaN(mecDate.getTime())) {
      return res.status(400).json({
        message: 'La date de mise en circulation (MEC) est invalide',
      });
    }

    // Vérification que la date MEC est dans le passé
    const currentDate = new Date();
    if (mecDate > currentDate) {
      return res.status(400).json({
        message: 'La date de mise en circulation ne peut pas être future',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(proprietaire)) {
      return res.status(400).json({
        message: "L'identifiant du propriétaire (groupe) est invalide",
      });
    }

    let sanitizedConducteur = existingVehicule.conducteur;
    if (conducteur !== undefined && conducteur !== '') {
      if (!mongoose.Types.ObjectId.isValid(conducteur)) {
        return res.status(400).json({
          message: "L'identifiant du conducteur est invalide",
        });
      }
      sanitizedConducteur = conducteur;
    } else if (conducteur === '') {
      sanitizedConducteur = undefined;
    }

    const validEtats = ['Fonctionnel', 'Reparation', 'Accidenté', 'stock'];
    if (!validEtats.includes(etat)) {
      return res.status(400).json({
        message: `L'état doit être l'un des suivants : ${validEtats.join(', ')}`,
      });
    }

    // Vérifier les doublons pour immatriculation et numéro de châssis
    if (immatriculation && immatriculation !== existingVehicule.immatriculation) {
      const existingByImmat = await Vehicule.findOne({
        immatriculation,
        _id: { $ne: req.params.id },
      });
      if (existingByImmat) {
        return res.status(400).json({
          message: 'Immatriculation déjà utilisée par un autre véhicule',
        });
      }
    }

    if (numChassis && numChassis !== existingVehicule.numChassis) {
      const existingByChassis = await Vehicule.findOne({
        numChassis,
        _id: { $ne: req.params.id },
      });
      if (existingByChassis) {
        return res.status(400).json({
          message: 'Numéro de châssis déjà utilisé par un autre véhicule',
        });
      }
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    const updateData = {
      numero: numero !== undefined ? Number(numero) : existingVehicule.numero,
      marque: marque || existingVehicule.marque,
      modele: modele || existingVehicule.modele,
      immatriculation: immatriculation || existingVehicule.immatriculation,
      mec: mecDate || existingVehicule.mec,
      etat: etat || existingVehicule.etat,
      proprietaire: proprietaire || existingVehicule.proprietaire,
      numChassis: numChassis || existingVehicule.numChassis,
      typeMines: typeMines !== undefined ? typeMines : existingVehicule.typeMines,
      kilometrage: km,
      conducteur: sanitizedConducteur,
      documentUrl: existingVehicule.documentUrl,
    };

    if (req.file) {
      updateData.documentUrl = `${baseUrl}/Uploads/${req.file.filename}`;
    }

    const vehiculeUpdated = await Vehicule.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('conducteur', 'nom prenom')
      .populate('proprietaire', 'nom');

    if (!vehiculeUpdated) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    // Créer une notification pour la mise à jour du kilométrage
    try {
      await createVehicleUpdateNotification(vehiculeUpdated, 'kilometrage', req.user ? req.user.id : null);
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas échouer la requête si la notification échoue
    }

    // Vérifier les alertes si le kilométrage a changé
    if (km !== existingVehicule.kilometrage) {
      console.log(`Kilométrage modifié pour ${vehiculeUpdated.marque} ${vehiculeUpdated.modele}: ${km} km`);
      try {
        const alertResult = await checkAndCreateAlertsForVehicle(vehiculeUpdated._id, km);
        console.log('Résultat de la vérification des alertes:', alertResult);
        if (alertResult.success && alertResult.alerts && alertResult.alerts.length > 0) {
          console.log(`${alertResult.alerts.length} nouvelles alertes créées pour le véhicule`);
        }
      } catch (alertError) {
        console.error('Erreur lors de la vérification des alertes:', alertError);
      }
    }

    res.status(200).json({
      message: 'Véhicule mis à jour avec succès',
      vehicule: vehiculeUpdated,
    });
  } catch (error) {
    console.error('Erreur dans updateVehicule:', {
      message: error.message,
      stack: error.stack,
    });
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: 'Erreur de validation',
        errors,
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message: "L'immatriculation ou le numéro de châssis existe déjà",
      });
    }
    res.status(400).json({
      message: 'Erreur lors de la mise à jour du véhicule',
      erreur: error.message,
    });
  }
};
const getAllVehicules = async (req, res) => {
  try {
    const vehicules = await Vehicule.find()
      .populate('conducteur', 'nom prenom')
      .populate('proprietaire', 'nom');
    res.status(200).json(vehicules);
  } catch (error) {
    console.error('Erreur dans getAllVehicules:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des véhicules',
      erreur: error.message,
    });
  }
};


const getVehiculeById = async (req, res) => {
  try {
    const vehicule = await Vehicule.findById(req.params.id)
      .populate('conducteur', 'nom prenom')
      .populate('proprietaire', 'nom');
    if (!vehicule) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }
    res.status(200).json(vehicule);
  } catch (error) {
    console.error('Erreur dans getVehiculeById:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du véhicule',
      erreur: error.message,
    });
  }
};

const deleteVehicule = async (req, res) => {
  try {
    const vehiculeDeleted = await Vehicule.findByIdAndDelete(req.params.id);
    if (!vehiculeDeleted) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }
    res.status(200).json({ message: 'Véhicule supprimé avec succès' });
  } catch (error) {
    console.error('Erreur dans deleteVehicule:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du véhicule',
      erreur: error.message,
    });
  }
};
const createVehicule = async (req, res) => {
  try {
    console.log('Requête reçue pour créer un véhicule:', {
      body: req.body,
      file: req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'Aucun fichier',
    });

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'Le corps de la requête est vide ou mal formé',
      });
    }

    const {
      numero,
      marque,
      modele,
      immatriculation,
      mec,
      etat,
      proprietaire,
      numChassis,
      typeMines,
      kilometrage,
      conducteur,
    } = req.body;

    const requiredFields = [
      { key: 'numero', label: 'Numéro' },
      { key: 'marque', label: 'Marque' },
      { key: 'modele', label: 'Modèle' },
      { key: 'immatriculation', label: 'Immatriculation' },
      { key: 'mec', label: 'Date de mise en circulation' },
      { key: 'etat', label: 'État' },
      { key: 'proprietaire', label: 'Propriétaire' },
      { key: 'numChassis', label: 'Numéro de châssis' },
      { key: 'kilometrage', label: 'Kilométrage' },
    ];

    const missingFields = requiredFields.filter(
      (field) => !req.body[field.key] || req.body[field.key] === ''
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Champs requis manquants : ${missingFields.map((f) => f.label).join(', ')}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Un dossier (ZIP ou PDF) contenant les documents est requis',
      });
    }

    const km = Number(kilometrage);
    if (isNaN(km) || km < 0) {
      return res.status(400).json({
        message: 'Le kilométrage doit être un nombre positif',
      });
    }

    const mecDate = new Date(mec);
    if (isNaN(mecDate.getTime())) {
      return res.status(400).json({
        message: 'La date de mise en circulation (MEC) est invalide',
      });
    }

    // Vérification que la date MEC est dans le passé
    const currentDate = new Date();
    if (mecDate > currentDate) {
      return res.status(400).json({
        message: 'La date de mise en circulation ne peut pas être future',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(proprietaire)) {
      return res.status(400).json({
        message: "L'identifiant du propriétaire (groupe) est invalide",
      });
    }

    if (conducteur && !mongoose.Types.ObjectId.isValid(conducteur)) {
      return res.status(400).json({
        message: "L'identifiant du conducteur est invalide",
      });
    }

    const validEtats = ['Fonctionnel', 'Reparation', 'Accidenté', 'stock'];
    if (!validEtats.includes(etat)) {
      return res.status(400).json({
        message: `L'état doit être l'un des suivants : ${validEtats.join(', ')}`,
      });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const documentUrl = `${baseUrl}/Uploads/${req.file.filename}`;

    const vehiculeData = {
      numero: Number(numero),
      marque,
      modele,
      immatriculation,
      mec: mecDate,
      etat,
      proprietaire,
      numChassis,
      typeMines: typeMines || undefined,
      kilometrage: km,
      conducteur: conducteur || undefined,
      documentUrl,
    };

    const nouveauVehicule = new Vehicule(vehiculeData);
    await nouveauVehicule.save();

    const populatedVehicule = await Vehicule.findById(nouveauVehicule._id)
      .populate('conducteur', 'nom prenom')
      .populate('proprietaire', 'nom');

    res.status(201).json({
      message: 'Véhicule créé avec succès',
      vehicule: populatedVehicule,
    });
  } catch (error) {
    console.error('Erreur dans createVehicule:', {
      message: error.message,
      stack: error.stack,
    });
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: 'Erreur de validation',
        errors,
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message: "L'immatriculation ou le numéro de châssis existe déjà",
      });
    }
    res.status(400).json({
      message: 'Erreur lors de la création du véhicule',
      erreur: error.message,
    });
  }
};


module.exports = {
  createVehicule: [uploadMiddleware, handleMulterError, createVehicule], 
  getAllVehicules,
  getVehiculeById,
  updateVehicule: [uploadMiddleware, handleMulterError, updateVehicule], 
  deleteVehicule,
};