const mongoose = require('mongoose');
const User = require('../models/user');
const connectDB = require('../config/db');
require('dotenv').config();

async function migratePermissions() {
  try {
    await connectDB();


    // Mise à jour des utilisateurs sans `permissions.groupes`
    const updateResult = await User.updateMany(
      { 'permissions.groupes': { $exists: false } }, // Cible les utilisateurs sans `groupes`
      {
        $set: {
          'permissions.groupes': { creer: true, lire: true, modifier: true, supprimer: true }
        }
      }
    );

    console.log('Migration terminée:', updateResult);
  } catch (err) {
    console.error('Erreur lors de la migration:', err);
  } finally {
    // Fermeture de la connexion
    await mongoose.connection.close();
    console.log('Connexion à MongoDB fermée');
  }
}

migratePermissions().catch(err => console.error('Erreur générale:', err));