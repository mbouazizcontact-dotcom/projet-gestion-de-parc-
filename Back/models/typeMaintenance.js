const mongoose = require('mongoose');

const typeMaintenanceSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true,
    unique: true
  },
  description:  { type: String, },
  fréquence_recommandée: { type: String, required: true },
  type_intervention: { type: String, required: true },
  criticite: { 
    type: String, 
    enum: ['faible', 'moyenne', 'haute', 'critique'], 
    default: 'moyenne' 
  },
}, { timestamps: true });

module.exports = mongoose.model('TypeMaintenance', typeMaintenanceSchema);