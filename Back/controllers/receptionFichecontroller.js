const ReceptionFiche = require('../models/ReceptionFiche');
const Demande = require('../models/DemandePiece');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Mechanic = require('../models/Mecanicien');
const mongoose = require('mongoose');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../Uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Le fichier doit être une image'), false);
    }
  },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Le fichier est trop volumineux. La taille maximale est de 5 Mo.' });
    }
    return res.status(400).json({ message: 'Erreur lors de l\'upload de l\'image.', error: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

exports.createReceptionFiche = async (req, res) => {
  try {
    const ficheData = { ...req.body };
    console.log('Données reçues pour la création de la fiche:', ficheData);
    console.log('markerPositions reçus:', ficheData.markerPositions);


    if (ficheData.markerPositions && !Array.isArray(ficheData.markerPositions)) {
      return res.status(400).json({
        message: 'markerPositions doit être un tableau',
      });
    }
    const newFiche = new ReceptionFiche(ficheData);
    await newFiche.save();

    console.log('Fiche créée avec succès:', newFiche);

    res.status(201).json({
      message: 'Fiche de réception créée avec succès',
      fiche: newFiche,
    });
  } catch (error) {
    console.error('Erreur lors de la création de la fiche:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la création de la fiche',
      error: error.message,
    });
  }
};


exports.getReceptionFicheById = async (req, res) => {
  try {
    const fiche = await ReceptionFiche.findById(req.params.id).populate('employee', 'nom prenom');
    if (!fiche) {
      return res.status(404).json({
        message: 'Fiche de réception non trouvée',
      });
    }
    console.log('Fiche récupérée:', fiche);
    console.log('markerPositions récupérés:', fiche.markerPositions);

    res.status(200).json(fiche);
  } catch (error) {
    console.error('Erreur lors de la récupération de la fiche:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la récupération de la fiche',
      error: error.message,
    });
  }
};
exports.getAllReceptionFiches = async (req, res) => {
  try {
    const fiches = await ReceptionFiche.find().sort({ createdAt: -1 });
    console.log('Fiches récupérées:', fiches.length);
    res.status(200).json(fiches);
  } catch (error) {
    console.error('Erreur lors de la récupération des fiches:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la récupération des fiches',
      error: error.message,
    });
  }
};
exports.deleteReceptionFiche = async (req, res) => {
  try {
    const fiche = await ReceptionFiche.findById(req.params.id);
    if (!fiche) {
      return res.status(404).json({
        message: 'Fiche de réception non trouvée',
      });
    }

    // Supprimer l'image associée si elle existe
    if (fiche.uploadedImage) {
      const imagePath = path.join(__dirname, '../Uploads', path.basename(fiche.uploadedImage));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Image supprimée: ${imagePath}`);
      } else {
        console.warn(`Image non trouvée à: ${imagePath}`);
      }
    }

    await ReceptionFiche.findByIdAndDelete(req.params.id);
    console.log('Fiche supprimée avec succès:', req.params.id);

    res.status(200).json({
      message: 'Fiche de réception supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la fiche:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la suppression de la fiche',
      error: error.message,
    });
  }
};

exports.uploadImage = [
  upload.single('image'),
  handleMulterError,
  (req, res) => {
    console.log('Requête POST reçue pour /upload-image');
    console.log('Fichier reçu:', req.file);
    try {
      if (!req.file) {
        console.log('Aucun fichier téléchargé');
        return res.status(400).json({ message: 'Aucune image téléchargée' });
      }
      const imageUrl = `/Uploads/${req.file.filename}`;
      console.log('Image téléchargée avec succès:', imageUrl);
      res.status(200).json({ imageUrl });
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      res.status(500).json({
        message: 'Erreur lors de l\'upload de l\'image',
        error: error.message,
      });
    }
  },
];

// Request parts for a reception fiche
exports.requestParts = async (req, res) => {
  try {
    const { ficheId, mechanicId, parts } = req.body;

    // Validate inputs
    if (!ficheId || !mongoose.Types.ObjectId.isValid(ficheId)) {
      return res.status(400).json({ message: 'ID de la fiche invalide.' });
    }
    if (!mechanicId || !mongoose.Types.ObjectId.isValid(mechanicId)) {
      return res.status(400).json({ message: 'ID du mécanicien invalide.' });
    }
    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({ message: 'La liste des pièces demandées est requise et doit être un tableau non vide.' });
    }

    // Find the reception fiche
    const fiche = await ReceptionFiche.findById(ficheId);
    if (!fiche) {
      return res.status(404).json({ message: 'Fiche de réception non trouvée.' });
    }

    // Find the mechanic
    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic) {
      return res.status(404).json({ message: 'Mécanicien non trouvé.' });
    }

    // Update the fiche with requested parts
    fiche.requestedParts = [...(fiche.requestedParts || []), ...parts];
    await fiche.save();
    console.log('Pièces ajoutées à la fiche:', fiche.requestedParts);

    // Create a new Demande for each part
    const demandes = parts.map((part) => ({
      dateCommande: new Date(),
      demandeur: mechanicId,
      marque: fiche.carMake || '',
      modele: fiche.carMake ? fiche.carMake.split(' ')[1] || '' : '',
      immatriculation: fiche.licensePlate || '',
      pieces: part,
      etat: 'En cours',
    }));

    const insertedDemandes = await Demande.insertMany(demandes);
    console.log('Demandes de pièces créées:', insertedDemandes);

    res.status(201).json({
      message: 'Demande de pièces enregistrée avec succès.',
      fiche,
      demandes: insertedDemandes,
    });
  } catch (error) {
    console.error('Erreur lors de la demande de pièces:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la demande de pièces.',
      error: error.message,
    });
  }
};