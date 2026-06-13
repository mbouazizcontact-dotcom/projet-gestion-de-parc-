const mongoose = require('mongoose');

const demandeSchema = new mongoose.Schema({
  dateCommande: {
    type: Date,
    required: true,
    default: Date.now,
  },
  demandeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mecanicien',
    required: true
  },
  marque: {
    type: String,
    required: true,
    trim: true,
  },
  modele: {
    type: String,
    required: true,
    trim: true,
  },
  immatriculation: {
    type: String,
    required: true,
    trim: true,
  },
  pieces: {
    type: String,
    required: true,
    trim: true,
  },
  etat: {
    type: String,
    enum: ['En cours', 'Approuvé', 'Refusé'],
    default: 'En cours',
    required: true,
  },
}, { timestamps: true });

// Ajouter un index pour optimiser les recherches
demandeSchema.index({ immatriculation: 1, dateCommande: -1 });

module.exports = mongoose.model('Demande', demandeSchema);