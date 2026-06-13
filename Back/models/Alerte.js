const mongoose = require('mongoose');

const alerteSchema = new mongoose.Schema({
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicule',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['Urgente', 'Moyenne', 'Faible'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Nouvelle', 'Vue', 'Résolue'],
            default: 'Nouvelle',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
  
    resolvedAt: {
      type: Date,
    },
    maintenanceTypeId: { // Référence au type de maintenance
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TypeMaintenance',
    },
    maintenanceScheduled: { // Indique si une maintenance a été programmée
      type: Boolean,
      default: false
    }
  }, { timestamps: true });
  module.exports = mongoose.model('Alerte', alerteSchema);