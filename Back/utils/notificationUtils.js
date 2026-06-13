const Notification = require('../models/Notification');

/**
 * Vérifie si une notification similaire existe déjà
 * @param {Object} notificationData - Données de la notification à vérifier
 * @returns {Promise<boolean>} - true si une notification similaire existe déjà
 */
const notificationExists = async (notificationData) => {
  try {
    // Créer un filtre pour rechercher une notification similaire
    const filter = {
      type: notificationData.type
    };

    // Si c'est une alerte, vérifier aussi par alertId
    if (notificationData.alertId) {
      filter.alertId = notificationData.alertId;
    }
    
    // Si c'est une mise à jour de véhicule, vérifier aussi par vehicleId + récence
    if (notificationData.vehicleId) {
      filter.vehicleId = notificationData.vehicleId;
      
      // Pour les mises à jour de véhicule, vérifier si une notification récente existe (moins de 5 minutes)
      if (notificationData.type === 'system') {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        filter.timestamp = { $gt: fiveMinutesAgo };
        filter.message = notificationData.message;
      }
    }

    const existingNotification = await Notification.findOne(filter);
    return !!existingNotification;
  } catch (error) {
    console.error('Erreur lors de la vérification de notification existante:', error);
    return false; // En cas d'erreur, supposer qu'il n'y a pas de doublon
  }
};

/**
 * Crée une notification pour une alerte
 * @param {Object} alert - L'objet alerte
 * @param {string} vehicleLabel - Le nom/label du véhicule (marque modèle immatriculation)
 * @param {string} userId - ID de l'utilisateur (optionnel)
 * @returns {Promise<Object>} - La notification créée
 */
const createAlertNotification = async (alert, vehicleLabel, userId = null) => {
  try {
    const notificationData = {
      titre: `Alerte ${alert.urgency || 'Système'}`,
      message: alert.message,
      type: 'alert',
      alertId: alert._id,
      vehicleId: alert.vehicleId,
      vehicleLabel: vehicleLabel,
      urgency: alert.urgency,
      read: false,
      timestamp: new Date()
    };

    // Ajouter l'userId s'il est fourni
    if (userId) {
      notificationData.userId = userId;
    }

    // Vérifier si une notification similaire existe déjà
    const exists = await notificationExists(notificationData);
    if (exists) {
      console.log(`Notification déjà existante pour l'alerte ${alert._id}, notification non créée`);
      return null;
    }

    const notification = new Notification(notificationData);
    await notification.save();
    
    console.log(`Notification créée pour l'alerte ${alert._id}`);
    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

/**
 * Crée une notification pour une mise à jour de véhicule
 * @param {Object} vehicle - L'objet véhicule
 * @param {string} updateType - Type de mise à jour (kilometrage, maintenance, etc.)
 * @param {string} userId - ID de l'utilisateur (optionnel)
 * @returns {Promise<Object>} - La notification créée
 */
const createVehicleUpdateNotification = async (vehicle, updateType, userId = null) => {
  try {
    const vehicleLabel = `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`;
    let message = '';
    
    switch (updateType) {
      case 'kilometrage':
        message = `Le kilométrage du véhicule ${vehicleLabel} a été mis à jour à ${vehicle.kilometrage} km`;
        break;
      case 'maintenance':
        message = `Une maintenance a été programmée pour le véhicule ${vehicleLabel}`;
        break;
      default:
        message = `Le véhicule ${vehicleLabel} a été mis à jour`;
    }
    
    const notificationData = {
      titre: `Mise à jour véhicule`,
      message,
      type: 'system',
      vehicleId: vehicle._id,
      vehicleLabel,
      read: false,
      timestamp: new Date()
    };

    // Ajouter l'userId s'il est fourni
    if (userId) {
      notificationData.userId = userId;
    }

    // Vérifier si une notification similaire existe déjà
    const exists = await notificationExists(notificationData);
    if (exists) {
      console.log(`Notification déjà existante pour le véhicule ${vehicle._id}, notification non créée`);
      return null;
    }

    const notification = new Notification(notificationData);
    await notification.save();
    
    console.log(`Notification créée pour la mise à jour du véhicule ${vehicle._id}`);
    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

module.exports = {
  createAlertNotification,
  createVehicleUpdateNotification
}; 