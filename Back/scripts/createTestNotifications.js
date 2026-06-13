/**
 * Script pour créer des notifications de test
 * Exécuter avec: node scripts/createTestNotifications.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('../models/Notification');
const Vehicule = require('../models/Vehicule');

// Charger les variables d'environnement
dotenv.config();

// Fonction pour créer des notifications de test
async function createTestNotifications() {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connexion à MongoDB établie');

    // Récupérer quelques véhicules pour utiliser leurs IDs
    const vehicles = await Vehicule.find().limit(5);
    
    if (vehicles.length === 0) {
      console.log('Aucun véhicule trouvé dans la base de données');
      process.exit(1);
    }

    // Créer des notifications de test
    const testNotifications = [
      {
        titre: 'Alerte Urgente',
        message: 'Maintenance urgente requise pour le véhicule',
        type: 'alert',
        vehicleId: vehicles[0]._id,
        vehicleLabel: `${vehicles[0].marque} ${vehicles[0].modele} (${vehicles[0].immatriculation})`,
        urgency: 'Urgente',
        read: false,
        timestamp: new Date()
      },
      {
        titre: 'Alerte Moyenne',
        message: 'Vérification des freins nécessaire',
        type: 'alert',
        vehicleId: vehicles.length > 1 ? vehicles[1]._id : vehicles[0]._id,
        vehicleLabel: vehicles.length > 1 
          ? `${vehicles[1].marque} ${vehicles[1].modele} (${vehicles[1].immatriculation})`
          : `${vehicles[0].marque} ${vehicles[0].modele} (${vehicles[0].immatriculation})`,
        urgency: 'Moyenne',
        read: false,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 jour plus tôt
      },
      {
        titre: 'Maintenance Planifiée',
        message: 'Vidange d\'huile programmée',
        type: 'maintenance',
        vehicleId: vehicles.length > 2 ? vehicles[2]._id : vehicles[0]._id,
        vehicleLabel: vehicles.length > 2
          ? `${vehicles[2].marque} ${vehicles[2].modele} (${vehicles[2].immatriculation})`
          : `${vehicles[0].marque} ${vehicles[0].modele} (${vehicles[0].immatriculation})`,
        read: true,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 jours plus tôt
      },
      {
        titre: 'Mise à jour système',
        message: 'Le système a été mis à jour avec succès',
        type: 'system',
        read: false,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours plus tôt
      }
    ];

    // Sauvegarder les notifications dans la base de données
    const result = await Notification.insertMany(testNotifications);
    
    console.log(`${result.length} notifications de test créées avec succès`);
    console.log('IDs des notifications créées:');
    result.forEach(notif => {
      console.log(`- ${notif._id}: ${notif.titre}`);
    });

    // Déconnexion de la base de données
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB');
    
  } catch (error) {
    console.error('Erreur lors de la création des notifications de test:', error);
    process.exit(1);
  }
}

// Exécuter la fonction
createTestNotifications(); 