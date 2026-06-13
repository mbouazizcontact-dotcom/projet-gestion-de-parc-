const mongoose = require('mongoose');
const Garage = require('../models/Garages');
const Mecanicien = require('../models/Mecanicien');

// Create a garage
exports.createGarage = async (req, res) => {
  try {
    const { nom, adresse, telephone, email } = req.body;

    // Vérifier les champs obligatoires
    if (!nom || !adresse) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires' });
    }

    // Vérifier le format de l'email s'il est fourni
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Veuillez entrer un email valide' });
    }

    // Vérifier l'unicité de l'email s'il est fourni
    if (email) {
      const existingGarage = await Garage.findOne({ email });
      if (existingGarage) {
        return res.status(400).json({ message: 'Un garage avec cet email existe déjà' });
      }
    }

    // Vérifier le format du téléphone s'il est fourni
    if (telephone && !/^\d{8}$/.test(telephone)) {
      return res.status(400).json({ message: 'Le numéro de téléphone doit comporter exactement 8 chiffres' });
    }

    const garage = new Garage({ nom, adresse, telephone, email });
    await garage.save();
    res.status(201).json({ message: 'Garage ajouté avec succès', garage });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    console.error('Erreur lors de la création du garage:', error);
    res.status(400).json({ message: 'Erreur lors de la création du garage', error: error.message });
  }
};

// Get all garages
exports.getAllGarages = async (req, res) => {
  try {
    const garages = await Garage.find();

    // Inclure les mécaniciens si demandé
    if (req.query.includeMechanics === 'true') {
      const garagesWithMechanics = await Promise.all(
        garages.map(async (garage) => {
          const mechanics = await Mecanicien.find({ garage: garage._id }).select('nom prenom email statut');
          return {
            ...garage._doc,
            mechanics,
          };
        })
      );
      return res.status(200).json(garagesWithMechanics);
    }

    res.status(200).json(garages);
  } catch (error) {
    console.error('Erreur lors de la récupération des garages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des garages', error: error.message });
  }
};

// Get a garage by ID
exports.getGarageById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID du garage invalide' });
    }

    const garage = await Garage.findById(req.params.id);
    if (!garage) {
      return res.status(404).json({ message: 'Garage non trouvé' });
    }

    // Inclure les mécaniciens si demandé
    if (req.query.includeMechanics === 'true') {
      const mechanics = await Mecanicien.find({ garage: garage._id }).select('nom prenom email statut');
      return res.status(200).json({ ...garage._doc, mechanics });
    }

    res.status(200).json(garage);
  } catch (error) {
    console.error('Erreur lors de la récupération du garage:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du garage', error: error.message });
  }
};

// Update a garage
exports.updateGarage = async (req, res) => {
  try {
    const { nom, adresse, telephone, email } = req.body;

    // Vérifier les champs obligatoires
    if (!nom || !adresse) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires' });
    }

    // Vérifier le format de l'email s'il est fourni
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Veuillez entrer un email valide' });
    }

    // Vérifier l'unicité de l'email s'il est modifié
    if (email) {
      const existingGarage = await Garage.findOne({ email, _id: { $ne: req.params.id } });
      if (existingGarage) {
        return res.status(400).json({ message: 'Un garage avec cet email existe déjà' });
      }
    }

    // Vérifier le format du téléphone s'il est fourni
    if (telephone && !/^\d{8}$/.test(telephone)) {
      return res.status(400).json({ message: 'Le numéro de téléphone doit comporter exactement 8 chiffres' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID du garage invalide' });
    }

    const garage = await Garage.findByIdAndUpdate(
      req.params.id,
      { nom, adresse, telephone, email },
      { new: true, runValidators: true }
    );
    if (!garage) {
      return res.status(404).json({ message: 'Garage non trouvé' });
    }

    res.status(200).json({ message: 'Garage modifié avec succès', garage });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    console.error('Erreur lors de la mise à jour du garage:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour du garage', error: error.message });
  }
};

// Delete a garage
exports.deleteGarage = async (req, res) => {
  try {
    // Vérifier la validité de l'ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID du garage invalide' });
    }

    // Vérifier si le garage existe
    const garage = await Garage.findById(req.params.id);
    if (!garage) {
      return res.status(404).json({ message: 'Garage non trouvé' });
    }

    // Vérifier si des mécaniciens sont assignés
    const mechanics = await Mecanicien.find({ garage: req.params.id });
    if (mechanics.length > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer le garage car il est assigné à des mécaniciens. Veuillez d’abord réassigner ou supprimer ces mécaniciens',
        mechanics: mechanics.map((m) => ({
          id: m._id,
          nom: m.nom,
          prenom: m.prenom,
          email: m.email,
        })),
      });
    }

    // Supprimer le garage
    await Garage.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Garage supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du garage:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du garage', error: error.message });
  }
};