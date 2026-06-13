const mongoose = require('mongoose');

const groupeSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true, 
    unique: true 
  },
  nombreConducteurs: { 
    type: Number, 
    default: 0 
  },
  nombreVehiculesFonctionnels: { 
    type: Number, 
    default: 0 
  },
  nombreVehiculesAccidentes: { 
    type: Number, 
    default: 0 
  },
  nombreVehiculesStock: { 
    type: Number, 
    default: 0 
  },
  nombreVehiculesReparation: { 
    type: Number, 
    default: 0 
  },
  nombreTotalVehicules: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

// Méthode pour mettre à jour les statistiques du groupe
groupeSchema.methods.updateCounts = async function() {
  const vehicules = await mongoose.model('Vehicule').find({ proprietaire: this._id });
  
  this.nombreConducteurs = new Set(vehicules
    .filter(v => v.conducteur)
    .map(v => v.conducteur.toString())).size;
  
  this.nombreVehiculesFonctionnels = vehicules.filter(v => v.etat === 'Fonctionnel').length;
  this.nombreVehiculesAccidentes = vehicules.filter(v => v.etat === 'Accidenté').length;
  this.nombreVehiculesStock = vehicules.filter(v => v.etat === 'stock').length;
  this.nombreVehiculesReparation = vehicules.filter(v => v.etat === 'Reparation').length;
  this.nombreTotalVehicules = vehicules.length;

  await this.save();
};

module.exports = mongoose.model('Groupe', groupeSchema);