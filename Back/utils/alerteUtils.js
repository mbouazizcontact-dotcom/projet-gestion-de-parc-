const mongoose = require('mongoose');
const Alerte = require('../models/Alerte');
const Vehicule = require('../models/Vehicule');
const TypeMaintenance = require('../models/typeMaintenance');
const { createAlertNotification } = require('./notificationUtils');

// Fonction pour vérifier et créer des alertes pour un véhicule spécifique
const checkAndCreateAlertsForVehicle = async (vehicleId, newKilometrage) => {
  try {
    console.log(`Vérification d'alertes pour le véhicule ${vehicleId} avec kilométrage ${newKilometrage}`);
    
    // Vérifier si le véhicule existe
    const vehicle = await Vehicule.findById(vehicleId);
    if (!vehicle) {
      console.error(`Véhicule non trouvé: ${vehicleId}`);
      return { success: false, message: 'Véhicule non trouvé' };
    }
    
    const vehicleLabel = `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`;
    
    // Récupérer tous les types de maintenance
    const maintenanceTypes = await TypeMaintenance.find();
    if (!maintenanceTypes || maintenanceTypes.length === 0) {
      console.log('Aucun type de maintenance trouvé');
      return { success: true, message: 'Aucun type de maintenance trouvé' };
    }

    // Rechercher les alertes existantes pour ce véhicule
    const existingAlerts = await Alerte.find({ vehicleId });
    
    // Pour chaque type de maintenance, vérifier le kilométrage
    const createdAlerts = [];
    const createdNotifications = [];
    
    for (const maintenanceType of maintenanceTypes) {
      // Vérifier si ce type a une fréquence kilométrique
      if (!maintenanceType.frequence_km) continue;
      
      // Calculer quand la prochaine maintenance est due
      const nextDueKm = Math.ceil(newKilometrage / maintenanceType.frequence_km) * maintenanceType.frequence_km;
      
      // Si le nouveau kilométrage est proche du prochain dû (à 90% ou plus)
      const nearingMaintenance = newKilometrage >= (nextDueKm - (maintenanceType.frequence_km * 0.1));
      
      if (nearingMaintenance) {
        // Vérifier si une alerte existe déjà pour ce type de maintenance et n'est pas résolue
        const existingAlert = existingAlerts.find(
          alert => 
            alert.maintenanceTypeId && 
            alert.maintenanceTypeId.toString() === maintenanceType._id.toString() &&
            alert.status !== 'Résolue' &&
            alert.nextDueKm === nextDueKm
        );
        
        if (!existingAlert) {
          // Créer une nouvelle alerte
          const remainingKm = nextDueKm - newKilometrage;
          const dueDate = new Date();
          // Ajouter 7 jours pour l'échéance par défaut
          dueDate.setDate(dueDate.getDate() + 7);
          
          const urgencyLevel = 
            remainingKm <= 0 ? 'Urgente' :
            remainingKm <= maintenanceType.frequence_km * 0.05 ? 'Moyenne' : 'Faible';
          
          const newAlert = new Alerte({
            vehicleId,
            message: `${maintenanceType.nom} requise pour ${vehicle.marque} ${vehicle.modele} - ${remainingKm <= 0 ? 'Maintenance dépassée' : `${remainingKm} km restants`}`,
            urgency: urgencyLevel,
            status: 'Nouvelle',
            date: new Date(),
            dueDate,
            maintenanceTypeId: maintenanceType._id,
            nextDueKm
          });
          
          const savedAlert = await newAlert.save();
          console.log(`Nouvelle alerte créée: ${savedAlert._id}`);
          createdAlerts.push(savedAlert);
          
          // Créer une notification pour l'alerte
          try {
            const notification = await createAlertNotification(
              savedAlert, 
              vehicleLabel
            );
            createdNotifications.push(notification);
          } catch (notifError) {
            console.error('Erreur lors de la création de la notification:', notifError);
          }
        }
      }
    }
    
    // Retourner les résultats
    return { 
      success: true, 
      message: `${createdAlerts.length} alertes créées pour le véhicule ${vehicle.marque} ${vehicle.modele}`,
      alerts: createdAlerts,
      notifications: createdNotifications
    };
    
  } catch (error) {
    console.error('Erreur dans checkAndCreateAlertsForVehicle:', error);
    return { success: false, message: error.message, error };
  }
};

module.exports = {
  checkAndCreateAlertsForVehicle
}; 