// services/notificationService.js
const Notification = require('../models/Notification');
const { sendPushNotification } = require('./pushNotificationService');

const emitMaintenanceAlert = async (alertData) => {
  try {
    // Enregistrer la notification dans la base de données
    const notification = await Notification.create({
      type: 'maintenance',
      title: `Maintenance requise: ${alertData.maintenanceType}`,
      message: alertData.message,
      relatedEntity: 'vehicule',
      relatedEntityId: alertData.vehicleId,
      data: {
        vehicleId: alertData.vehicleId,
        maintenanceType: alertData.maintenanceType,
        mileage: alertData.mileage
      },
      read: false
    });

    // Envoyer une notification push
    await sendPushNotification({
      title: `Maintenance requise: ${alertData.maintenanceType}`,
      body: alertData.message,
      data: {
        type: 'maintenance',
        vehicleId: alertData.vehicleId
      }
    });

    return notification;
  } catch (error) {
    console.error('Erreur lors de l\'émission de l\'alerte de maintenance:', error);
    throw error;
  }
};

module.exports = { emitMaintenanceAlert };