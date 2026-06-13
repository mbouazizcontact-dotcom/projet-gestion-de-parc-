// controllers/alerteController.js
const mongoose = require('mongoose');
const Alerte = require('../models/Alerte');
const { createAlertNotification } = require('../utils/notificationUtils');

// Récupérer toutes les alertes
const getAllAlerts = async (req, res) => {
  try {
    
    // Récupérer toutes les alertes avec une population plus sûre
    const alerts = await Alerte.find()
      .populate('vehicleId maintenanceTypeId')
      .sort({ createdAt: -1 }); // Trier par date de création décroissante

    const formattedAlerts = alerts
      .filter(alert => alert.vehicleId !== null && alert.vehicleId !== undefined)
      .map((alert) => {
        // Vérification de l'existence du véhicule
        if (!alert.vehicleId || typeof alert.vehicleId !== 'object') {
          return null;
        }
        
        return {
          _id: alert._id,
          alertFullId: alert._id,
          vehicleId: alert.vehicleId._id,
          vehicle: `${alert.vehicleId.marque} ${alert.vehicleId.modele} (${alert.vehicleId.immatriculation})`,
          message: alert.message,
          date: alert.date,
          urgency: alert.urgency,
          status: alert.status,
          dueDate: alert.dueDate,
          maintenanceTypeId: alert.maintenanceTypeId?._id || null,
          nextDueKm: alert.nextDueKm || null,
          createdAt: alert.createdAt
        };
      })
      .filter(alert => alert !== null); // Filtrer les alertes nulles


    // Compter les alertes par statut
    const alertCountsByStatus = {
      total: formattedAlerts.length,
      Nouvelle: formattedAlerts.filter(a => a.status === 'Nouvelle').length,
      Vue: formattedAlerts.filter(a => a.status === 'Vue').length,
      Résolue: formattedAlerts.filter(a => a.status === 'Résolue').length
    };

    res.status(200).json({
      message: 'Alertes récupérées avec succès',
      alerts: formattedAlerts,
      counts: alertCountsByStatus
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des alertes',
      erreur: error.message
    });
  }
};

const getVehicleAlerts = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({ message: "L'identifiant du véhicule est invalide" });
    }

    const alerts = await Alerte.find({ vehicleId }).populate('vehicleId maintenanceTypeId');

    const formattedAlerts = alerts.map((alert) => ({
      _id: alert._id,
      alertFullId: alert._id,
      vehicleId: alert.vehicleId._id,
      vehicle: `${alert.vehicleId.marque} ${alert.vehicleId.modele} (${alert.vehicleId.immatriculation})`,
      message: alert.message,
      date: alert.date.toLocaleDateString('fr-FR'),
      urgency: alert.urgency,
      status: alert.status,
      dueDate: alert.dueDate.toLocaleDateString('fr-FR'),
      maintenanceTypeId: alert.maintenanceTypeId?._id || null,
      nextDueKm: alert.nextDueKm || null,
    }));

    res.status(200).json({
      message: 'Alertes récupérées avec succès',
      alerts: formattedAlerts,
    });
  } catch (error) {
    console.error('Erreur dans getVehicleAlerts:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des alertes',
      erreur: error.message,
    });
  }
};

// Ajouter une fonction pour créer une alerte et la notification correspondante
const createAlert = async (req, res) => {
  try {
    const { vehicleId, message, urgency, dueDate, maintenanceTypeId, nextDueKm } = req.body;
    
    if (!vehicleId || !message) {
      return res.status(400).json({ 
        message: 'L\'identifiant du véhicule et le message sont requis' 
      });
    }
    
    // Valider le niveau d'urgence
    const validUrgencies = ['Urgente', 'Moyenne', 'Faible'];
    if (urgency && !validUrgencies.includes(urgency)) {
      return res.status(400).json({ 
        message: 'Niveau d\'urgence invalide. Valeurs acceptées: Urgente, Moyenne, Faible' 
      });
    }
    
    // Créer une nouvelle alerte
    const newAlert = new Alerte({
      vehicleId,
      message,
      urgency: urgency || 'Moyenne',
      status: 'Nouvelle',
      date: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours par défaut
      maintenanceTypeId,
      nextDueKm
    });
    
    const savedAlert = await newAlert.save();
    
    // Créer une notification pour cette alerte
    try {
      // Chercher les informations du véhicule pour l'affichage
      const vehicule = await mongoose.model('Vehicule').findById(vehicleId);
      const vehicleLabel = vehicule 
        ? `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})` 
        : 'Véhicule inconnu';
      
      await createAlertNotification(savedAlert, vehicleLabel, req.user ? req.user.id : null);
    } catch (notifError) {
      // Ne pas échouer la création d'alerte si la notification échoue
    }
    
    res.status(201).json({
      message: 'Alerte créée avec succès',
      alert: savedAlert
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la création de l\'alerte',
      erreur: error.message
    });
  }
};

// Mettre à jour le statut d'une alerte
const updateAlertStatus = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(alertId)) {
      return res.status(400).json({ message: "L'identifiant de l'alerte est invalide" });
    }

    const validStatuses = ['Nouvelle', 'Vue', 'Résolue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const alert = await Alerte.findByIdAndUpdate(
      alertId,
      { 
        status,
        ...(status === 'Vue' && { dateVue: new Date() }),
        ...(status === 'Résolue' && { dateResolution: new Date() })
      },
      { new: true }
    ).populate('vehicleId');

    if (!alert) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }

    // Créer une notification pour le changement de statut si l'alerte est résolue
    if (status === 'Résolue') {
      try {
        const vehicleLabel = alert.vehicleId 
          ? `${alert.vehicleId.marque} ${alert.vehicleId.modele} (${alert.vehicleId.immatriculation})` 
          : 'Véhicule inconnu';
        
        // Créer une notification avec un message spécifique pour la résolution
        const resolutionAlert = {
          _id: alert._id,
          message: `Alerte résolue: ${alert.message}`,
          urgency: 'Faible',
          vehicleId: alert.vehicleId ? alert.vehicleId._id : null
        };
        
        await createAlertNotification(resolutionAlert, vehicleLabel, req.user ? req.user.id : null);
      } catch (notifError) {
        console.error('Erreur lors de la création de la notification de résolution:', notifError);
      }
    }

    res.status(200).json({
      message: 'Statut de l\'alerte mis à jour avec succès',
      alert
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut de l\'alerte',
      erreur: error.message
    });
  }
};

// Marquer toutes les alertes comme vues
const markAllAsRead = async (req, res) => {
  try {
    const result = await Alerte.updateMany(
      { status: 'Nouvelle' },
      { 
        status: 'Vue',
        dateVue: new Date()
      }
    );

    res.status(200).json({
      message: `${result.modifiedCount} alertes marquées comme vues`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors du marquage des alertes comme vues',
      erreur: error.message
    });
  }
};

module.exports = {
  getAllAlerts,
  getVehicleAlerts,
  createAlert,
  updateAlertStatus,
  markAllAsRead
};