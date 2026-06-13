import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from '../../Components/axios/axiosConfig';
import PropTypes from 'prop-types';
import { 
  MoonIcon, 
  SunIcon, 
  MagnifyingGlassIcon, 
  Cog6ToothIcon, 
  BellIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  WrenchIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../../context/NotificationContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const nom = localStorage.getItem('nom') || "Utilisateur";

const DashboardHeader = ({ 
  pageTitle, 
  userName = nom,
  userAvatar = null,
  toggleSidebar,
  toggleDarkMode,
  isDarkMode
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    notifications, 
    addNotification, 
    markAsRead, 
    deleteNotification, 
    fetchNotifications,
    updateLastVisit 
  } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 5;

  // Notifications par type
  const maintenanceNotifications = notifications.filter(
    n => n.type === 'maintenance'
  );

  const alertNotifications = notifications.filter(
    n => n.type === 'alert'
  );

  const systemNotifications = notifications.filter(
    n => n.type === 'system'
  );

  // Comptage des notifications non lues par type
  const unreadMaintenanceNotifications = maintenanceNotifications.filter(
    n => !n.read
  ).length;

  const unreadAlertNotifications = alertNotifications.filter(
    n => !n.read
  ).length;

  const unreadSystemNotifications = systemNotifications.filter(
    n => !n.read
  ).length;

  // Utiliser le nombre total de notifications non lues (read = false)
  const totalUnreadNotifications = notifications.filter(n => !n.read).length;

  // Débogage du compteur 
  useEffect(() => {
    // Recalculer le total des notifications non lues pour le débogage
    const unreadTotal = notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Calculer les notifications pour la page courante
  const getCurrentPageNotifications = (notifications) => {
    const startIndex = (currentPage - 1) * notificationsPerPage;
    const endIndex = startIndex + notificationsPerPage;
    return notifications.slice(startIndex, endIndex);
  };

  // Récupérer les alertes depuis le serveur
  let isFetchingAlerts = false;
  const fetchAlerts = async () => {
    try {
      if (isFetchingAlerts) {
        return;
      }
      
      isFetchingAlerts = true;
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get('http://localhost:5000/api/alertes', { headers });
      
      if (!response.data || !response.data.alerts) {
        console.error("Format de réponse d'alertes invalide:", response.data);
        isFetchingAlerts = false;
        return;
      }
      
      const { alerts, counts } = response.data;
      
      // Mettre à jour le nombre de nouvelles alertes dans le localStorage
      const newAlertsCount = counts.Nouvelle || 0;
      
      // Récupérer les IDs des alertes supprimées du localStorage
      const deletedAlertIds = JSON.parse(localStorage.getItem('deletedAlertIds') || '[]');
      
      // Filtrer les alertes supprimées et déjà présentes
      const existingAlertIds = notifications
        .filter(n => n.type === 'alert' && n.alertId)
        .map(n => n.alertId.toString());
      
      const newAlertNotifications = alerts
        .filter(alert => {
          const isNew = alert.status === 'Nouvelle';
          const isDuplicate = existingAlertIds.includes(alert._id.toString());
          const isDeleted = deletedAlertIds.includes(alert._id.toString());
          return isNew && !isDuplicate && !isDeleted;
        })
        .map(alert => ({
          type: 'alert',
          message: alert.message || `Alerte pour le véhicule ${alert.vehicle || 'inconnu'}`,
          titre: `Alerte ${alert.urgency || 'Système'}`,
          alertId: alert._id,
          vehicleLabel: alert.vehicle,
          vehicleId: alert.vehicleId,
          urgency: alert.urgency || 'Moyenne'
        }));

      if (newAlertNotifications.length > 0) {
        for (const notification of newAlertNotifications) {
          if (notification.message && notification.type) {
            await addNotification(notification);
          }
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
    } finally {
      isFetchingAlerts = false;
    }
  };

  useEffect(() => {
    // Charger les alertes au chargement de la page
    fetchAlerts();
    
    // Configurer la vérification périodique des nouvelles alertes
    // Utiliser un intervalle plus long pour éviter les appels excessifs à l'API
    const interval = setInterval(fetchAlerts, 60000); // Vérifier toutes les 60 secondes au lieu de 30
    
    // Écouter l'événement de mise à jour des alertes
    const handleAlertsUpdate = () => {
      fetchAlerts();
      // Mettre à jour les notifications depuis le backend
      fetchNotifications();
    };
    
    window.addEventListener('alertsUpdated', handleAlertsUpdate);
    
    // Nettoyer l'intervalle et l'événement lors du démontage du composant
    return () => {
      clearInterval(interval);
      window.removeEventListener('alertsUpdated', handleAlertsUpdate);
    };
  }, []);

  // Effet pour recharger les notifications lorsque la route change
  useEffect(() => {
    fetchNotifications();
    // Ne pas recharger les alertes à chaque changement de route pour éviter la duplication
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate("/");
  };

  const handleLogoutConfirmation = () => {
    Swal.fire({
      title: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      text: "Vous serez déconnecté de votre compte.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, déconnectez-moi',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  const handleNotificationClick = (notification) => {
    // Marquer la notification comme lue quand on clique dessus
    markAsRead(notification._id || notification.id);
    
    setIsNotificationsOpen(false);
    
    if (notification.type === 'maintenance' && notification.vehicleId) {
      navigate('/ScheduleMaintenance', {
        state: {
          vehicleId: notification.vehicleId,
          maintenanceType: notification.maintenanceType || 'Préventive',
          vehicleLabel: notification.vehicleLabel,
          currentKm: notification.currentKm,
          nextDueKm: notification.nextDueKm
        }
      });
    } else if (notification.type === 'alert') {
      // Si on est déjà sur la page Alertes, juste mettre à jour l'état sans naviguer
      if (location.pathname === '/Alertes') {
        // Émettre un événement personnalisé pour indiquer que l'alerte doit être mise en évidence
        const event = new CustomEvent('highlightAlert', { 
          detail: { alertId: notification.alertId } 
        });
        window.dispatchEvent(event);
      } else {
        // Sinon naviguer vers la page Alertes avec l'état
        navigate('/Alertes', {
          state: {
            alertId: notification.alertId,
            highlightAlert: true
          }
        });
      }
    } else if (notification.type === 'system' && notification.vehicleId) {
      // Pour les notifications système concernant un véhicule, naviguer vers la page de détail du véhicule
      navigate(`/Vehicules/Details/${notification.vehicleId}`, {
        state: {
          vehicleId: notification.vehicleId,
          highlightVehicle: true
        }
      });
    } else {
      // Pour les autres types de notifications, simplement marquer comme lu
      toast.info("Notification lue");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    return userName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return <WrenchIcon className="h-5 w-5 text-yellow-500" />;
      case 'alert':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'system':
        return <Cog6ToothIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Urgente':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Moyenne':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Faible':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const profileMenuItems = [
    { 
      label: 'Mon profil', 
      icon: UserCircleIcon, 
      action: () => navigate('/profile')
    },
    { 
      label: 'Paramètres', 
      icon: Cog6ToothIcon, 
      action: () => navigate('/parametre')
    }
  ];

  // Mise à jour lors de l'ouverture du panneau de notifications
  const handleNotificationsOpen = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    
    // Si on ouvre le panneau, mettre à jour la date de dernière visite
    if (!isNotificationsOpen) {
      updateLastVisit();
      // Rafraîchir les notifications lorsqu'on ouvre le panneau
      fetchNotifications();
    }
  };

  // Modifier la fonction deleteNotification pour gérer les alertes supprimées
  const handleDeleteNotification = async (notificationId, alertId) => {
    if (alertId) {
      // Si c'est une alerte, ajouter son ID à la liste des alertes supprimées
      const deletedAlertIds = JSON.parse(localStorage.getItem('deletedAlertIds') || '[]');
      if (!deletedAlertIds.includes(alertId)) {
        deletedAlertIds.push(alertId);
        localStorage.setItem('deletedAlertIds', JSON.stringify(deletedAlertIds));
      }
    }
    await deleteNotification(notificationId);
    fetchNotifications();
    toast.success('Notification supprimée');
  };

  return (
    <div className={`px-4 md:px-10 fixed top-0 z-10 transition-all duration-300 ${
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-[#f4f7fe] bg-opacity-70 backdrop-blur-md text-gray-800'
    } border-none rounded-2xl mt-1 md:left-64 left-0 right-0 md:ml-4`}>
      <div className="flex justify-between items-center p-2 md:p-4">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 mr-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="text-sm">
            <p className={`hidden sm:block ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              Pages / {pageTitle}
            </p>
            <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {pageTitle}
            </h1>
          </div>
        </div>
        <div className="flex items-center">
          <div className="hidden md:flex items-center space-x-4">
            <div className={`relative ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              <input
                type="text"
                placeholder="Rechercher..."
                className={`pl-10 pr-4 py-2 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                }`}
              />
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5" />
            </div>
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={handleNotificationsOpen}
                className={`p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500 group ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                <BellIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                {totalUnreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                    {totalUnreadNotifications}
                  </span>
                )}
              </button>
              {isNotificationsOpen && (
                <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl py-1.5 z-50 ${
                  isDarkMode ? 'bg-gray-700 text-white ring-1 ring-gray-600' : 'bg-white text-gray-800 ring-1 ring-gray-200'
                } max-h-96 overflow-y-auto`}>
                  <div className="px-4 py-2 border-b dark:border-gray-600 flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          fetchNotifications();
                          toast.success('Notifications rafraîchies');
                        }}
                        className="text-xs text-green-500 hover:text-green-700 p-1 rounded-md hover:bg-gray-200"
                        title="Rafraîchir"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          [...maintenanceNotifications, ...alertNotifications, ...systemNotifications].forEach(n => {
                            if (!n.read) {
                              markAsRead(n._id || n.id);
                            }
                          });
                          // Rafraîchir les notifications immédiatement
                          fetchNotifications();
                          toast.success('Toutes les notifications marquées comme lues');
                        }}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Tout marquer comme lu
                      </button>
                    </div>
                  </div>
                  
                  {/* Section des alertes */}
                  {alertNotifications.length > 0 && (
                    <div className="px-3 py-2 bg-red-50 border-b border-red-100">
                      <h4 className="text-xs font-semibold text-red-700 uppercase">Nouvelles Alertes ({unreadAlertNotifications})</h4>
                    </div>
                  )}
                  
                  {getCurrentPageNotifications(alertNotifications).map((notification) => (
                    <div
                      key={notification._id || notification.id}
                      className={`flex items-start w-full px-4 py-3 text-left border-b last:border-b-0 ${
                        isDarkMode 
                          ? notification.read 
                            ? 'hover:bg-gray-600' 
                            : 'bg-gray-600 hover:bg-gray-500'
                          : notification.read 
                            ? 'hover:bg-gray-100' 
                            : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <div className="mr-3 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className={`font-medium ${
                            !notification.read ? 'text-blue-600 dark:text-blue-400' : ''
                          }`}>
                            {notification.vehicleLabel || 'Alerte véhicule'}
                          </p>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id || notification.id);
                                  // Rafraîchir les notifications immédiatement pour mettre à jour le compteur
                                  fetchNotifications();
                                  toast.success('Notification marquée comme lue');
                                }}
                                className="text-blue-500 hover:text-blue-700 p-1 text-xs rounded-md hover:bg-gray-200"
                                title="Marquer comme lu"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id || notification.id, notification.alertId);
                              }}
                              className="text-red-500 hover:text-red-700 p-1 text-xs rounded-md hover:bg-gray-200"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left"
                        >
                          <p className="text-sm mt-1">{notification.message}</p>
                          {notification.urgency && (
                            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${getUrgencyColor(notification.urgency)}`}>
                              {notification.urgency}
                            </span>
                          )}
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            Cliquez pour voir les détails
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Section des systèmes */}
                  {systemNotifications.length > 0 && (
                    <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                      <h4 className="text-xs font-semibold text-blue-700 uppercase">Mises à jour système ({unreadSystemNotifications})</h4>
                    </div>
                  )}
                  
                  {getCurrentPageNotifications(systemNotifications).map((notification) => (
                    <div
                      key={notification._id || notification.id}
                      className={`flex items-start w-full px-4 py-3 text-left border-b last:border-b-0 ${
                        isDarkMode 
                          ? notification.read 
                            ? 'hover:bg-gray-600' 
                            : 'bg-gray-600 hover:bg-gray-500'
                          : notification.read 
                            ? 'hover:bg-gray-100' 
                            : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <div className="mr-3 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className={`font-medium ${
                            !notification.read ? 'text-blue-600 dark:text-blue-400' : ''
                          }`}>
                            {notification.vehicleLabel || 'Mise à jour système'}
                          </p>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id || notification.id);
                                  // Rafraîchir les notifications immédiatement pour mettre à jour le compteur
                                  fetchNotifications();
                                  toast.success('Notification marquée comme lue');
                                }}
                                className="text-blue-500 hover:text-blue-700 p-1 text-xs rounded-md hover:bg-gray-200"
                                title="Marquer comme lu"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id || notification.id, notification.alertId);
                              }}
                              className="text-red-500 hover:text-red-700 p-1 text-xs rounded-md hover:bg-gray-200"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left"
                        >
                          <p className="text-sm mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Section des maintenances */}
                  {maintenanceNotifications.length > 0 && (
                    <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-100">
                      <h4 className="text-xs font-semibold text-yellow-700 uppercase">Maintenances ({unreadMaintenanceNotifications})</h4>
                    </div>
                  )}
                  
                  {getCurrentPageNotifications(maintenanceNotifications).map((notification) => (
                    <div
                      key={notification._id || notification.id}
                      className={`flex items-start w-full px-4 py-3 text-left border-b last:border-b-0 ${
                        isDarkMode 
                          ? notification.read 
                            ? 'hover:bg-gray-600' 
                            : 'bg-gray-600 hover:bg-gray-500'
                          : notification.read 
                            ? 'hover:bg-gray-100' 
                            : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <div className="mr-3 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className={`font-medium ${
                            !notification.read ? 'text-blue-600 dark:text-blue-400' : ''
                          }`}>
                            {notification.vehicleLabel || 'Maintenance requise'}
                          </p>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id || notification.id);
                                  // Rafraîchir les notifications immédiatement pour mettre à jour le compteur
                                  fetchNotifications();
                                  toast.success('Notification marquée comme lue');
                                }}
                                className="text-blue-500 hover:text-blue-700 p-1 text-xs rounded-md hover:bg-gray-200"
                                title="Marquer comme lu"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id || notification.id, notification.alertId);
                              }}
                              className="text-red-500 hover:text-red-700 p-1 text-xs rounded-md hover:bg-gray-200"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left"
                        >
                          <p className="text-sm mt-1">{notification.message}</p>
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            Cliquez pour programmer
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {maintenanceNotifications.length === 0 && alertNotifications.length === 0 && systemNotifications.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Aucune notification
                    </div>
                  )}
                  
                  {/* Ajouter la pagination */}
                  {notifications.length > notificationsPerPage && (
                    <div className="px-4 py-2 border-t dark:border-gray-600 flex justify-between items-center">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-2 py-1 rounded ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        Précédent
                      </button>
                      <span className="text-sm">
                        Page {currentPage} sur {Math.ceil(notifications.length / notificationsPerPage)}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(notifications.length / notificationsPerPage)))}
                        disabled={currentPage === Math.ceil(notifications.length / notificationsPerPage)}
                        className={`px-2 py-1 rounded ${
                          currentPage === Math.ceil(notifications.length / notificationsPerPage)
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
           
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 rounded-lg p-1 hover:bg-opacity-10 hover:bg-gray-500"
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-700' : 'bg-blue-100'
                  } text-sm font-bold ${
                    isDarkMode ? 'text-white' : 'text-blue-600'
                  }`}>
                    {getInitials()}
                  </div>
                )}
                <span className={`hidden md:inline text-sm font-medium ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {userName}
                </span>
              </button>
              {isProfileOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1.5 ${
                  isDarkMode ? 'bg-gray-700 text-white ring-1 ring-gray-600' : 'bg-white text-gray-800 ring-1 ring-gray-200'
                }`}>
                  {profileMenuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={item.action}
                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <item.icon className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={handleLogoutConfirmation}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <div className="relative">
                  <Bars3Icon className="h-6 w-6" />
                  {totalUnreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                      {totalUnreadNotifications}
                    </span>
                  )}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className={`md:hidden py-4 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="grid grid-cols-3 gap-2 px-4">
            <button
              onClick={() => {
                handleNotificationsOpen();
                setIsMobileMenuOpen(false);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <div className="relative">
                <BellIcon className="h-6 w-6" />
                {totalUnreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                    {totalUnreadNotifications}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Notifs</span>
            </button>
           
            <button
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <UserCircleIcon className="h-6 w-6" />
              <span className="text-xs mt-1">Profil</span>
            </button>
          </div>
        </div>
      )}
    </div>
    
  );
};

DashboardHeader.propTypes = {
  pageTitle: PropTypes.string.isRequired,
  userName: PropTypes.string,
  userAvatar: PropTypes.string,
  toggleSidebar: PropTypes.func.isRequired,
  toggleDarkMode: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired
};

export default DashboardHeader;