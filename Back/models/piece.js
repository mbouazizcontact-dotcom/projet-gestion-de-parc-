const mongoose = require('mongoose');

const pieceSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true,
  },
  nom: {
    type: String,
    required: true,
  },
  categorie: {
    type: String,
    required: true,
  },
  // Informations du véhicule
  marque: {
    type: String,
    required: false,
  },
  modele: {
    type: String,
    required: false,
  },
  immatriculation: {
    type: String,
    required: false,
  },
  vehiculeAssigne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule',
    required: false,
  },
  dateEntree: {
    type: Date,
    required: true,
    default: Date.now,
  },
  etat: {
    type: String,
    required: true,
    enum: ['Neuf', 'Occasion'],
  },
}, { timestamps: true });

module.exports = mongoose.model('Piece', pieceSchema);