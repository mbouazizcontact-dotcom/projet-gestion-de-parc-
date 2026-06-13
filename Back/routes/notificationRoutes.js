const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const protect = require('../middleware/authMiddleware');

// Appliquer l'authentification à toutes les routes de notifications
router.use(protect);

// Récupérer toutes les notifications de l'utilisateur connecté
router.get('/', notificationController.getAllNotifications);

// Récupérer les nouvelles notifications depuis la dernière visite
router.get('/new', notificationController.getNewNotificationsSinceLastVisit);

// Obtenir le nombre de notifications non lues depuis la dernière visite
router.get('/count', notificationController.getUnreadCountSinceLastVisit);

// Créer une nouvelle notification
router.post('/', notificationController.createNotification);

// Marquer une notification comme lue
router.put('/:id/read', notificationController.markAsRead);

// Mettre à jour lastViewed sans marquer comme lu
router.put('/:id/viewed', notificationController.updateLastViewed);

// Supprimer une notification spécifique
router.delete('/:id', notificationController.deleteNotification);

// Supprimer toutes les notifications de l'utilisateur
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router;