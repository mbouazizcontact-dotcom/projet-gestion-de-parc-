const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  nomFamille: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String, required: true, unique: false },
  password: { type: String, required: true },
  Groupe: { type: String, required: true, default: 'Aucun' },
  role: { type: String, enum: ['Super Admin', 'Gestionnaire de Parc', 'Mécanicien'], default: 'Non spécifié' },
  statut: { type: String, enum: ['Actif', 'Inactif', 'Archivé'], default: 'Actif' },
  archived: { type: Boolean, default: false },
  permissions: {
    type: {
      TableauDeBord: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Conducteurs: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Groupes: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Vehicules: { 
        creer: Boolean, 
        lire: Boolean, 
        modifier: Boolean, 
        supprimer: Boolean, 
        modifierKilometrage: Boolean 
      },
      Calendrier: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Carburant: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Maintenance: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      TypesMaintenances: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      MaintenanceReparations: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Alertes: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Atelier: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Garages: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Mecaniciens: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Pieces: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      PiecesEnStock: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      PiecesDemandees: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      HistoriqueDesReparations: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Archives: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      FicheReceptions: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      FicheInterventions: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Reclamations: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Utilisateurs: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
      Parametres: { creer: Boolean, lire: Boolean, modifier: Boolean, supprimer: Boolean },
    },
    default: {
      TableauDeBord: { creer: false, lire: true, modifier: false, supprimer: false },
      Conducteurs: { creer: false, lire: true, modifier: false, supprimer: false },
      Groupes: { creer: false, lire: true, modifier: false, supprimer: false },
      Vehicules: { 
        creer: false, 
        lire: true, 
        modifier: false, 
        supprimer: false, 
        modifierKilometrage: false // Nouvelle permission
      },
      Calendrier: { creer: false, lire: true, modifier: false, supprimer: false },
      Carburant: { creer: false, lire: true, modifier: false, supprimer: false },
      Maintenance: { creer: false, lire: true, modifier: false, supprimer: false },
      TypesMaintenances: { creer: false, lire: true, modifier: false, supprimer: false },
      MaintenanceReparations: { creer: false, lire: true, modifier: false, supprimer: false },
      Alertes: { creer: false, lire: true, modifier: false, supprimer: false },
      Atelier: { creer: false, lire: true, modifier: false, supprimer: false },
      Garages: { creer: false, lire: true, modifier: false, supprimer: false },
      Mecaniciens: { creer: false, lire: true, modifier: false, supprimer: false },
      Pieces: { creer: false, lire: true, modifier: false, supprimer: false },
      PiecesEnStock: { creer: false, lire: true, modifier: false, supprimer: false },
      PiecesDemandees: { creer: false, lire: true, modifier: false, supprimer: false },
      HistoriqueDesReparations: { creer: false, lire: true, modifier: false, supprimer: false },
      Archives: { creer: false, lire: true, modifier: false, supprimer: false },
      FicheReceptions: { creer: false, lire: true, modifier: false, supprimer: false },
      FicheInterventions: { creer: false, lire: true, modifier: false, supprimer: false },
      Reclamations: { creer: false, lire: true, modifier: false, supprimer: false },
      Utilisateurs: { creer: false, lire: true, modifier: false, supprimer: false },
      Parametres: { creer: false, lire: true, modifier: false, supprimer: false },
    },
  },
});

UserSchema.pre('save', async function (next) {
  // Hachage du mot de passe si modifié
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Permissions spécifiques pour les groupes
  if (this.Groupe === 'Mécaniciens') {
    this.permissions = {
      ...this.permissions,
      Atelier: { lire: true, creer: true, modifier: true, supprimer: false },
      Mecaniciens: { lire: true, creer: true, modifier: true, supprimer: true },
      Pieces: { lire: true, creer: true, modifier: true, supprimer: false },
      PiecesDemandees: { lire: true, creer: true, modifier: true, supprimer: false },
      FicheInterventions: { lire: true, creer: true, modifier: true, supprimer: false },
      FicheReceptions: { lire: true, creer: true, modifier: true, supprimer: false },
      Reclamations: { lire: true, creer: true, modifier: true, supprimer: false },
      HistoriqueDesReparations: { lire: true, creer: true, modifier: true, supprimer: false },
      Archives: { lire: true, creer: true, modifier: true, supprimer: false },
      Vehicules: { 
        ...this.permissions.Vehicules, 
        modifierKilometrage: true // Mécaniciens peuvent modifier le kilométrage
      },
    };
  } else if (this.Groupe === 'Garagistes') {
    this.permissions = {
      ...this.permissions,
      Atelier: { lire: true, creer: true, modifier: true, supprimer: false },
      Garages: { lire: true, creer: true, modifier: true, supprimer: true },
      Pieces: { lire: true, creer: true, modifier: true, supprimer: false },
      PiecesDemandees: { lire: true, creer: true, modifier: true, supprimer: false },
      FicheInterventions: { lire: true, creer: true, modifier: true, supprimer: false },
      FicheReceptions: { lire: true, creer: true, modifier: true, supprimer: false },
      Reclamations: { lire: true, creer: true, modifier: true, supprimer: false },
      HistoriqueDesReparations: { lire: true, creer: true, modifier: true, supprimer: false },
      Archives: { lire: true, creer: true, modifier: true, supprimer: false },
      Vehicules: { 
        ...this.permissions.Vehicules, 
        modifierKilometrage: true // Garagistes peuvent modifier le kilométrage
      },
    };
  }

  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Vérifier si le modèle existe déjà avant de le créer
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);



