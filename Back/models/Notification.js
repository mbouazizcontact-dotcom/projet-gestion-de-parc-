const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  titre: { 
    type: String 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['alert', 'maintenance', 'system'], 
    required: true 
  },
  alertId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Alerte'
  },
  vehicleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicule' 
  },
  vehicleLabel: { 
    type: String 
  },
  urgency: { 
    type: String, 
    enum: ['Urgente', 'Moyenne', 'Faible'] 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date 
  },
  lastViewed: {
    type: Date
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les requêtes fréquentes
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, timestamp: -1 });
notificationSchema.index({ alertId: 1 });
notificationSchema.index({ vehicleId: 1 });
notificationSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Notification', notificationSchema);