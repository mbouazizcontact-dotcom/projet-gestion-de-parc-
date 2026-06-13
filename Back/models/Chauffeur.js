const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  experience: { type: Number, required: true },
  age: { type: Number, required: true },
  disponibilite: { type: Boolean, default: true },
  permisRecto: { type: String, required: true }, // Optionnel pour mise à jour
  permisVerso: { type: String, required: true }  // Optionnel pour mise à jour
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);