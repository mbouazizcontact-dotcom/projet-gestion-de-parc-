const mongoose = require('mongoose');

const carburantSchema = new mongoose.Schema({
  vehicule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  quantite: {
    type: Number,
    required: true,
    min: [0, 'La quantité doit être positive']
  },
  cout: {
    type: Number,
    required: true,
    min: [0, 'Le coût doit être positif']
  },
  kilometrage: {
    type: Number,
    required: true,
    min: [0, 'Le kilométrage doit être positif']
  },
  typeCarburant: {
    type: String,
    enum: ['Essence', 'Diesel', 'GAZ', 'Électrique'],
    default: 'Essence'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Carburant', carburantSchema);