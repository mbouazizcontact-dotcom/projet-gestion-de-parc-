const Mecanicien = require('../models/Mecanicien');
const Garage = require('../models/Garages');
const User = require('../models/user');
const mongoose = require('mongoose'); // Add this import if not already present
const bcrypt = require('bcryptjs');
const Maintenance = require('../models/Maintenance');


// Get all mechanics
exports.getAllMecaniciens = async (req, res) => {
  try {
    const query = {};
    if (req.query.statut) {
      query.statut = req.query.statut;
    }
    if (req.query.garage) {
      query.garage = req.query.garage; // Allow filtering by garage
    }
    const mecaniciens = await Mecanicien.find(query).populate('garage', 'nom adresse');
    res.status(200).json(mecaniciens);
  } catch (error) {
    console.error('Error fetching mechanics:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des mécaniciens', error: error.message });
  }
};

// Get single mechanic by ID
exports.getMecanicienById = async (req, res) => {
  try {
    const mecanicien = await Mecanicien.findById(req.params.id).populate('garage', 'nom adresse');
    if (!mecanicien) {
      return res.status(404).json({ message: 'Mécanicien non trouvé' });
    }
    res.status(200).json(mecanicien);
  } catch (error) {
    console.error('Error fetching mechanic:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du mécanicien', error: error.message });
  }
};

// Create new mechanic
exports.createMecanicien = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, experience, specialisation, dateEmboche, statut, garage } = req.body;

    // Validate garage exists
    const garageExists = await Garage.findById(garage);
    if (!garageExists) {
      return res.status(400).json({ message: 'Le garage spécifié n\'existe pas' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Create mechanic
    const mecanicien = new Mecanicien({
      nom,
      prenom,
      email,
      telephone,
      experience,
      specialisation,
      dateEmboche,
      statut,
      garage
    });

    // Create corresponding user
    const defaultPassword = `${prenom}${nom}123`; // Default password: firstname+lastname+123
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = new User({
      nom: `${prenom} ${nom}`,
      prenom,
      nomFamille: nom,
      email,
      telephone,
      password: hashedPassword,
      role: 'Mécanicien',
      statut: 'Actif',
      Groupe: specialisation || 'Mécaniciens'
    });

    try {
      // Save mechanic first
      await mecanicien.save();
      
      // Then save user
      await user.save();

      res.status(201).json({
        mecanicien,
        message: `Mécanicien créé avec succès. Mot de passe par défaut: ${defaultPassword}`
      });
    } catch (saveError) {
      // If user creation fails, delete the mechanic
      if (mecanicien._id) {
        await Mecanicien.findByIdAndDelete(mecanicien._id);
      }
      throw saveError;
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet email existe déjà' });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    console.error('Error creating mechanic:', error);
    res.status(400).json({ message: 'Erreur lors de la création du mécanicien', error: error.message });
  }
};

// Update mechanic
exports.updateMecanicien = async (req, res) => {
  try {
    const { statut, garage, nom, prenom, email, telephone, specialisation } = req.body;

    // Prevent concurrent assignment by checking statut if setting to Occupé
    if (statut === 'Occupé') {
      const mecanicien = await Mecanicien.findById(req.params.id);
      if (!mecanicien) {
        return res.status(404).json({ message: 'Mécanicien non trouvé' });
      }
      if (mecanicien.statut === 'Occupé') {
        return res.status(409).json({ message: 'Ce mécanicien est déjà occupé' });
      }
    }

    // Validate garage exists if provided
    if (garage) {
      const garageExists = await Garage.findById(garage);
      if (!garageExists) {
        return res.status(400).json({ message: 'Le garage spécifié n\'existe pas' });
      }
    }

    // Update mechanic
    const mecanicien = await Mecanicien.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('garage', 'nom adresse');

    if (!mecanicien) {
      return res.status(404).json({ message: 'Mécanicien non trouvé' });
    }

    // Update corresponding user
    const user = await User.findOne({ email: mecanicien.email });
    if (user) {
      const userUpdate = {
        nom: `${prenom || mecanicien.prenom} ${nom || mecanicien.nom}`,
        prenom: prenom || mecanicien.prenom,
        nomFamille: nom || mecanicien.nom,
        email: email || mecanicien.email,
        telephone: telephone || mecanicien.telephone,
        Groupe: specialisation || mecanicien.specialisation,
        statut: statut === 'Disponible' ? 'Actif' : 'Inactif',
        role: 'Mécanicien'
      };

      await User.findByIdAndUpdate(
        user._id,
        userUpdate,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json(mecanicien);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet email existe déjà' });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    console.error('Error updating mechanic:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour du mécanicien', error: error.message });
  }
};

// Delete mechanic
exports.deleteMecanicien = async (req, res) => {
  try {
    const mecanicien = await Mecanicien.findById(req.params.id);
    if (!mecanicien) {
      return res.status(404).json({ message: 'Mécanicien non trouvé' });
    }

    // Vérifier si le mécanicien est affecté à une maintenance
    const maintenance = await Maintenance.findOne({ mechanic: req.params.id });
    if (maintenance) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer le mécanicien car il est affecté à une maintenance',
        maintenance: {
          id: maintenance._id,
          vehicule: maintenance.vehicule,
          datePrevue: maintenance.datePrevue
        }
      });
    }

    // Delete corresponding user
    const user = await User.findOne({ email: mecanicien.email });
    if (user) {
      await User.findByIdAndDelete(user._id);
    }

    // Delete mechanic
    await Mecanicien.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Mécanicien et utilisateur associé supprimés avec succès' });
  } catch (error) {
    console.error('Error deleting mechanic:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du mécanicien', error: error.message });
  }
};