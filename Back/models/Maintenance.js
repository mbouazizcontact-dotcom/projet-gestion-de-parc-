const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const maintenanceSchema = new Schema({
  vehicule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule',
    required: true,
  },
  typeMaintenance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TypeMaintenance',
    required: true,
  },
  kilometrage: {
    type: Number,
    required: true,
    min: [0, 'Le kilométrage doit être positif'],
  },
  dateReservation: {
    type: Date,
    required: true,
    default: Date.now,
  },
  datePrevue: {
    type: Date,
    required: true,
  },
  statut: {
    type: String,
    enum: ['Backlog', 'À faire' ,'Vérification','En cours', 'Terminée'],
    required: true,
    default: 'Backlog',
  },
  notes: {
    type: String,
    trim: true,
  },
  urgence: {
    type: Boolean,
    trim: true,
    default : false,
  },
  importance: {
    type: Boolean,
    trim: true,
    default : false,
  },
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mecanicien', // Remplacez par 'Garagiste' si vous utilisez un modèle séparé
    required: true, // Optionnel pour permettre des maintenances sans mécanicien assigné
  },
  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garage',
    required: false, 
  },
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);