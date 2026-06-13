const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mecanicienSchema = new Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  telephone: {
    type: String,
    required: true,
    match: [/^\d{8}$/, 'Le numéro de téléphone doit comporter 8 chiffres.']
  },
  experience: {
    type: Number,
    required: true,
    min: 0,
    max: 50,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} doit être un nombre entier.'
    }
  },
  specialisation: {
    type: String,
    required: true,
    trim: true
  },
  dateEmboche: {
    type: Date,
    required: true,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['Disponible', 'Occupé'],
    default: 'Disponible'
  },
  garage: {
    type: Schema.Types.ObjectId,
    ref: 'Garage',     required: true 
  }
});

module.exports = mongoose.model('Mecanicien', mecanicienSchema);