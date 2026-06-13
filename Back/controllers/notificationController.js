const Notification = require('../models/Notification');

// Créer une notification
exports.createNotification = async (req, res) => {
  try {
    const { titre, message, type, alertId, vehicleId, vehicleLabel, urgency } = req.body;

    // Validation des champs obligatoires
    if (!message) {
      return res.status(400).json({ 
        message: 'Le champ message est obligatoire',
        fields: req.body 
      });
    }

    if (!type) {
      return res.status(400).json({ 
        message: 'Le champ type est obligatoire',
        fields: req.body 
      });
    }

    if (!['alert', 'maintenance', 'system'].includes(type)) {
      return res.status(400).json({ 
        message: 'Le type doit être "alert", "maintenance" ou "system"',
        fields: req.body 
      });
    }

    // Créer l'objet notification sans le userId
    const notificationData = {
      titre,
      message,
      type,
      alertId,
      vehicleId,
      vehicleLabel,
      urgency,
      read: false,
      timestamp: new Date()
    };

    // Ajouter userId seulement s'il est disponible dans req.user
    if (req.user && req.user.id) {
      notificationData.userId = req.user.id;
    }

    const notification = new Notification(notificationData);

    await notification.save();

    res.status(201).json(notification);
  } catch (error) {
    console.error('Erreur de création de notification:', error);
    res.status(400).json({ 
      message: error.message,
      error: error.name,
      fields: req.body
    });
  }
};

// Obtenir toutes les notifications de l'utilisateur connecté
exports.getAllNotifications = async (req, res) => {
  try {
    const { read } = req.query;
    const filter = {};

    // Ajouter le filtre userId seulement si l'utilisateur est connecté
    if (req.user && req.user.id) {
      filter.userId = req.user.id;
    }

    if (read !== undefined) filter.read = read === 'true';

    const notifications = await Notification.find(filter)
      .sort({ timestamp: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    // Préparer le filtre de recherche
    const filter = { _id: req.params.id };
    
    // Ajouter le filtre userId seulement si l'utilisateur est connecté
    if (req.user && req.user.id) {
      filter.userId = req.user.id;
    }

    // Vérifier que la notification existe
    const notification = await Notification.findOne(filter);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    notification.read = true;
    notification.readAt = new Date();
    notification.lastViewed = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une notification spécifique
exports.deleteNotification = async (req, res) => {
  try {
    // Préparer le filtre de recherche
    const filter = { _id: req.params.id };
    
    // Ajouter le filtre userId seulement si l'utilisateur est connecté
    if (req.user && req.user.id) {
      filter.userId = req.user.id;
    }

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await Notification.findOneAndDelete(filter);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json({ message: 'Notification supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer toutes les notifications de l'utilisateur
exports.deleteAllNotifications = async (req, res) => {
  try {
    const filter = {};
    
    // Ajouter le filtre userId seulement si l'utilisateur est connecté
    if (req.user && req.user.id) {
      filter.userId = req.user.id;
    }

    await Notification.deleteMany(filter);
    res.json({ message: 'Toutes les notifications ont été supprimées avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les notifications non lues de l'utilisateur
exports.getUnreadNotifications = async (req, res) => {
  try {
    const filter = { read: false };
    
    // Ajouter le filtre userId seulement si l'utilisateur est connecté
    if (req.user && req.user.id) {
      filter.userId = req.user.id;
    }

    const notifications = await Notification.find(filter)
      .sort({ timestamp: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les notifications non vues depuis la dernière connexion
exports.getNewNotificationsSinceLastVisit = async (req, res) => {
  try {
    const { lastVisit } = req.query;
    const filter = {};
    
    // Ajouter le filtre userId seulement si l'utilisateur est connecté
    if (req.user && req.user.id) {
      filter.userId = req.user.id;
    }

    // Si lastVisit est fourni, filtrer les notifications plus récentes
    if (lastVisit) {
      filter.timestamp = { $gt: new Date(lastVisit) };
    }

    // Ajouter le filtre pour les notifications non lues
    filter.read = false;
    
    // Récupérer les notifications correspondantes
    const notifications = await Notification.find(filter)
      .sort({ timestamp: -1 });

    // Récupérer le nombre total de notifications non lues
    const unreadCount = await Notification.countDocuments({
      ...filter,
      read: false
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour lastViewed sans marquer comme lu
exports.updateLastViewed = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Préparer le filtre de recherche
    const filter = { _id: id };
    
    // Ajouter le filtre userId seulement si l'utilisateur est connecté
    if (req.user && req.user.id) {
      filter.userId = req.user.id;
    }

    // Vérifier que la notification existe
    const notification = await Notification.findOne(filter);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    notification.lastViewed = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtenir le nombre de notifications non lues depuis la dernière visite
exports.getUnreadCountSinceLastVisit = async (req, res) => {
  try {
    const { lastVisitTimestamp } = req.query;
    const filter = { read: false };
    
    // Ajouter le filtre userId seulement si l'utilisateur est connecté
    if (req.user && req.user.id) {
      filter.userId = req.user.id;
    }

    // Si lastVisitTimestamp est fourni, ne compter que les notifications plus récentes
    if (lastVisitTimestamp) {
      filter.timestamp = { $gt: new Date(lastVisitTimestamp) };
    }

    const count = await Notification.countDocuments(filter);
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};