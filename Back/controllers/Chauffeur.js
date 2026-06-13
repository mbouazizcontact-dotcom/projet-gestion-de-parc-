const Driver = require('../models/Chauffeur');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempFolder = `uploads/temp_${Date.now()}`;
    fs.mkdir(tempFolder, { recursive: true })
      .then(() => cb(null, tempFolder))
      .catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (validTypes.includes(file.mimetype)) {
    cb(null, true);
  } 
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const addDriver = [
  upload.fields([{ name: 'permisRecto', maxCount: 1 }, { name: 'permisVerso', maxCount: 1 }]),
  async (req, res) => {
    let tempFolder;
    try {
      console.log("Request Body:", req.body);
      console.log("Uploaded Files:", req.files);

      const { nom, prenom, email, telephone, experience, age, disponibilite } = req.body;
      const permisRectoTemp = req.files['permisRecto']?.[0]?.path;
      const permisVersoTemp = req.files['permisVerso']?.[0]?.path;

      if (!permisRectoTemp || !permisVersoTemp) {
        return res.status(400).json({ message: "Les images recto et verso du permis sont requises pour un nouveau conducteur" });
      }

      tempFolder = path.dirname(permisRectoTemp);

      const newDriver = new Driver({
        nom,
        prenom,
        email,
        telephone,
        experience: parseInt(experience),
        age: parseInt(age),
        disponibilite: disponibilite === 'true',
        permisRecto: '',
        permisVerso: ''
      });

      console.log("Saving new driver...");
      await newDriver.save();

      const driverId = newDriver._id.toString();
      const driverFolder = path.join('uploads', driverId);
      console.log("Creating driver folder:", driverFolder);
      await fs.mkdir(driverFolder, { recursive: true });

      const permisRectoPath = path.join(driverFolder, `permisRecto${path.extname(permisRectoTemp)}`);
      const permisVersoPath = path.join(driverFolder, `permisVerso${path.extname(permisVersoTemp)}`);

      console.log("Renaming files to:", { permisRectoPath, permisVersoPath });
      await fs.rename(permisRectoTemp, permisRectoPath);
      await fs.rename(permisVersoTemp, permisVersoPath);

      console.log("Removing temp folder:", tempFolder);
      await fs.rm(tempFolder, { recursive: true });

      newDriver.permisRecto = permisRectoPath;
      newDriver.permisVerso = permisVersoPath;
      console.log("Updating driver with file paths...");
      await newDriver.save();

      const baseUrl = `${req.protocol}://${req.get('host')}/`;
      res.status(201).json({
        ...newDriver._doc,
        permisRectoUrl: baseUrl + newDriver.permisRecto,
        permisVersoUrl: baseUrl + newDriver.permisVerso
      });
    } catch (error) {
      console.error("Error in addDriver:", {
        message: error.message,
        stack: error.stack,
        requestBody: req.body,
        files: req.files
      });
      if (tempFolder) {
        await fs.rm(tempFolder, { recursive: true }).catch(err => console.error('Erreur nettoyage temporaire:', err));
      }
      res.status(500).json({ error: error.message || "Une erreur est survenue lors de l'ajout du conducteur" });
    }
  }
];
const getAllDrivers = async (req, res) => {
  try {
    const Driver = require('../models/Chauffeur');
    const Vehicle = require('../models/Vehicule');
    const baseUrl = `${req.protocol}://${req.get('host')}/`;

    // Récupérer tous les conducteurs
    const drivers = await Driver.find();

    // Pour chaque conducteur, trouver les véhicules associés et peupler le proprietaire
    const driversWithVehicles = await Promise.all(
      drivers.map(async (driver) => {
        const vehicles = await Vehicle.find({ conducteur: driver._id }).populate('proprietaire');
        return {
          ...driver._doc,
          permisRectoUrl: driver.permisRecto ? baseUrl + driver.permisRecto : null,
          permisVersoUrl: driver.permisVerso ? baseUrl + driver.permisVerso : null,
          vehicles: vehicles.map((vehicle) => ({
            _id: vehicle._id,
            marque: vehicle.marque,
            modele: vehicle.modele,
            proprietaire: vehicle.proprietaire ? {
              _id: vehicle.proprietaire._id,
              nom: vehicle.proprietaire.nom
            } : null
          }))
        };
      })
    );

    res.status(200).json(driversWithVehicles);
  } catch (error) {
    console.error('Erreur dans getAllDrivers:', error);
    res.status(500).json({ error: error.message });
  }
};
const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Chauffeur non trouvé" });
    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    const driverWithUrls = {
      ...driver._doc,
      permisRectoUrl: driver.permisRecto ? baseUrl + driver.permisRecto : null,
      permisVersoUrl: driver.permisVerso ? baseUrl + driver.permisVerso : null
    };
    res.status(200).json(driverWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateDriver = [
  upload.fields([{ name: 'permisRecto', maxCount: 1 }, { name: 'permisVerso', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { nom, prenom, email, telephone, experience, age, disponibilite } = req.body;
      const existingDriver = await Driver.findById(req.params.id);
      if (!existingDriver) return res.status(404).json({ message: "Chauffeur non trouvé" });

      const updateData = {
        nom,
        prenom,
        email,
        telephone,
        experience: parseInt(experience),
        age: parseInt(age),
        disponibilite: disponibilite === 'true',
        permisRecto: existingDriver.permisRecto, // Conserver l'existant par défaut
        permisVerso: existingDriver.permisVerso  // Conserver l'existant par défaut
      };

      // Mise à jour des fichiers uniquement si fournis
      if (req.files['permisRecto']) {
        if (existingDriver.permisRecto) await fs.unlink(existingDriver.permisRecto).catch(err => console.error('Erreur suppression ancien permisRecto:', err));
        updateData.permisRecto = req.files['permisRecto'][0].path;
      }
      if (req.files['permisVerso']) {
        if (existingDriver.permisVerso) await fs.unlink(existingDriver.permisVerso).catch(err => console.error('Erreur suppression ancien permisVerso:', err));
        updateData.permisVerso = req.files['permisVerso'][0].path;
      }

      console.log('Données mises à jour:', updateData); // Log pour débogage

      const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, updateData, { new: true });
      const baseUrl = `${req.protocol}://${req.get('host')}/`;
      const driverWithUrls = {
        ...updatedDriver._doc,
        permisRectoUrl: updatedDriver.permisRecto ? baseUrl + updatedDriver.permisRecto : null,
        permisVersoUrl: updatedDriver.permisVerso ? baseUrl + updatedDriver.permisVerso : null
      };
      res.status(200).json(driverWithUrls);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
];
const deleteDriver = async (req, res) => {
  try {
    const Driver = require('../models/Chauffeur');
    const Vehicle = require('../models/Vehicule');
    const driverId = req.params.id;

    // Vérifier si le conducteur existe
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Chauffeur non trouvé" });
    }

    // Vérifier si le conducteur est assigné à un véhicule
    const assignedVehicle = await Vehicle.findOne({ conducteur: driverId });
    if (assignedVehicle) {
      return res.status(400).json({
        message: "Impossible de supprimer ce chauffeur : il est assigné à un véhicule.",
        vehicle: {
          _id: assignedVehicle._id,
          marque: assignedVehicle.marque,
          modele: assignedVehicle.modele
        }
      });
    }

    // Supprimer le dossier des fichiers du conducteur
    const driverFolder = path.join('Uploads', driverId);
    await fs.rm(driverFolder, { recursive: true }).catch(err =>
      console.error('Erreur suppression dossier:', err)
    );

    // Supprimer le conducteur
    await Driver.findByIdAndDelete(driverId);

    res.status(200).json({ message: "Chauffeur supprimé avec succès" });
  } catch (error) {
    console.error('Erreur dans deleteDriver:', error);
    res.status(500).json({ error: error.message || "Une erreur est survenue lors de la suppression du chauffeur" });
  }
};
const getDriverVehicles = async (req, res) => {
  try {
    const Vehicle = require("../models/Vehicle");
    const vehicles = await Vehicle.find({ conducteur: req.params.id });
    if (!vehicles.length) return res.status(404).json({ message: "Aucun véhicule assigné à ce chauffeur" });
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  addDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  getDriverVehicles
};