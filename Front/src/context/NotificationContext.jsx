import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import axios from '../Components/axios/axiosConfig';
import PropTypes from 'prop-types';

const NotificationContext = createContext();

// Actions
const SET_NOTIFICATIONS = 'SET_NOTIFICATIONS';
const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const MARK_AS_READ = 'MARK_AS_READ';
const DELETE_NOTIFICATION = 'DELETE_NOTIFICATION';
const CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS';

const notificationReducer = (state, action) => {
  switch (action.type) {
    case SET_NOTIFICATIONS:
      // Remplacer complètement l'état par les nouvelles notifications
      return action.payload;
    case ADD_NOTIFICATION:
      // Vérification plus stricte des doublons
      if (action.payload._id) {
        // Si la notification a un _id MongoDB, vérifier par _id
        if (state.some(n => n._id && n._id.toString() === action.payload._id.toString())) {
          return state;
        }
      }
      if (action.payload.id) {
        // Si la notification a un id client-side, vérifier par id
        if (state.some(n => n.id && n.id === action.payload.id)) {
          return state;
        }
      }
      if (action.payload.alertId) {
        // Si la notification a un alertId, vérifier les doublons par alertId aussi
        if (state.some(n => n.alertId && n.alertId.toString() === action.payload.alertId.toString())) {
        return state;
        }
      }
      return [...state, action.payload];
    case MARK_AS_READ:
      return state.map(notification => {
        // Vérifier l'ID MongoDB (_id) ou l'ID client-side (id)
        if ((notification._id && notification._id === action.payload) || 
            (notification.id && notification.id === action.payload)) {
          return { ...notification, read: true };
        }
        return notification;
      });
    case DELETE_NOTIFICATION:
      return state.filter(notification => 
        (notification._id !== action.payload) && (notification.id !== action.payload)
      );
    case CLEAR_NOTIFICATIONS:
      return [];
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);
  const [lastVisitTimestamp, setLastVisitTimestamp] = useState(() => {
    const saved = localStorage.getItem('lastNotificationVisit');
    return saved ? new Date(saved) : new Date();
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les notifications depuis le backend
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Si pas de token, on ne peut pas récupérer les notifications
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/api/notifications', { headers });
      
      if (response.data && Array.isArray(response.data)) {
        // Mettre à jour le state
        dispatch({ type: SET_NOTIFICATIONS, payload: response.data });
        
        // Mettre à jour le compteur de notifications non lues
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    }
  };

  // Récupérer le nombre de notifications non lues depuis la dernière visite
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `http://localhost:5000/api/notifications/count?lastVisitTimestamp=${lastVisitTimestamp.toISOString()}`, 
        { headers }
      );
      
      if (response.data && typeof response.data.count === 'number') {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du compteur de notifications:', error);
    }
  };

  // Récupérer uniquement les nouvelles notifications depuis la dernière visite
  const fetchNewNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `http://localhost:5000/api/notifications/new?lastVisit=${lastVisitTimestamp.toISOString()}`, 
        { headers }
      );
      
      if (response.data && response.data.notifications) {
        // Mettre à jour l'unreadCount avec le compteur retourné par l'API
        setUnreadCount(response.data.unreadCount);
        
        // Ajouter les nouvelles notifications au state actuel
        const newNotifications = response.data.notifications;
        newNotifications.forEach(notification => {
          dispatch({ type: ADD_NOTIFICATION, payload: notification });
      });
    }
    } catch (error) {
      console.error('Erreur lors de la récupération des nouvelles notifications:', error);
    }
  };

  // Mettre à jour lastVisit dans le localStorage et récupérer les nouvelles notifications
  const updateLastVisit = () => {
    const now = new Date();
    setLastVisitTimestamp(now);
    localStorage.setItem('lastNotificationVisit', now.toISOString());
    
    // Mettre à jour le compteur
    fetchUnreadCount();
  };

  // Mettre à jour lastViewed pour une notification spécifique sans la marquer comme lue
  const updateLastViewed = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:5000/api/notifications/${id}/viewed`, {}, { headers });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de lastViewed:', error);
    }
  };

  // Charger les notifications lors du montage du composant
  useEffect(() => {
    fetchNotifications();
    
    // Mettre à jour lastVisit à l'initialisation
    updateLastVisit();
    
    // Vérifier périodiquement les nouvelles notifications
    const fetchInterval = setInterval(fetchNotifications, 30000);
    const countInterval = setInterval(fetchUnreadCount, 15000);
    
    return () => {
      clearInterval(fetchInterval);
      clearInterval(countInterval);
    };
  }, []);

  const addNotification = async (notification) => {
    try {
      // Validate required fields
      if (!notification.message) {
        console.error('Erreur: Le message de notification est requis');
        return;
      }

      if (!notification.type || !['alert', 'maintenance', 'system'].includes(notification.type)) {
        console.error('Erreur: Le type de notification doit être "alert", "maintenance" ou "system"');
        return;
      }

      // Vérifier d'abord si la notification existe déjà dans le state actuel
      // Si c'est une alerte, vérifier par alertId
      if (notification.alertId && 
          notifications.some(n => n.alertId && n.alertId.toString() === notification.alertId.toString())) {
        return;
      }

      // Pour les autres types, vérifier par message et timestamp si disponible
      if (notification.message && notification.timestamp &&
          notifications.some(n => 
            n.message === notification.message && 
            n.timestamp && 
            new Date(n.timestamp).getTime() === new Date(notification.timestamp).getTime())) {
        return;
      }

      // Ensure we have a properly formatted notification object
      const notificationToSend = {
        ...notification, 
        // Ensure these fields are defined and properly formatted
        titre: notification.titre || `Notification ${notification.type}`,
        message: notification.message,
        type: notification.type,
        // Optional fields - only include if they exist
        ...(notification.alertId && { alertId: notification.alertId }),
        ...(notification.vehicleId && { vehicleId: notification.vehicleId }),
        ...(notification.vehicleLabel && { vehicleLabel: notification.vehicleLabel }),
        ...(notification.urgency && { urgency: notification.urgency })
  };

      const token = localStorage.getItem('token');
      
      // Si pas de token, on ne peut pas créer de notification
      if (!token) {
        console.error('Erreur: Pas de token disponible pour créer une notification');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      // Envoyer la notification au backend
      const response = await axios.post('http://localhost:5000/api/notifications', notificationToSend, { headers });
      
      if (response.data) {
        // Mettre à jour le state
        dispatch({ 
          type: ADD_NOTIFICATION, 
          payload: response.data
        });
        
        // Rafraîchir les notifications après l'ajout
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'une notification:', error);
      if (error.response) {
        console.error('Détails de l\'erreur:', error.response.data);
      }
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Erreur: Pas de token disponible pour marquer la notification comme lue');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      // Marquer la notification comme lue dans le backend
      const response = await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, { headers });
      
      if (response.data) {
        // Mettre à jour le state localement
        dispatch({ type: MARK_AS_READ, payload: id });
        
        // Rafraîchir les notifications pour être sûr d'avoir les données à jour
        fetchNotifications();
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Erreur: Pas de token disponible pour supprimer les notifications');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      // Supprimer toutes les notifications dans le backend
      await axios.delete('http://localhost:5000/api/notifications', { headers });
      
      // Mettre à jour le state
      dispatch({ type: CLEAR_NOTIFICATIONS });
    } catch (error) {
      console.error('Erreur lors de la suppression des notifications:', error);
    }
  };
  
  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Erreur: Pas de token disponible pour supprimer la notification');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      // Supprimer la notification dans le backend
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, { headers });
      
      // Mettre à jour le state
      dispatch({ type: DELETE_NOTIFICATION, payload: id });
      
      // Rafraîchir les notifications
      fetchNotifications();
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        clearNotifications,
        deleteNotification,
        fetchNotifications,
        fetchNewNotifications,
        updateLastVisit,
        updateLastViewed
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};