import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faWrench,
  faCar,
  faFilter,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AlertDashboard = () => {
  const [activeTab, setActiveTab] = useState('Toutes');
  const [alertsData, setAlertsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState({
    urgentes: 0,
    maintenance: 0,
    diagnostics: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedAlertId, setHighlightedAlertId] = useState(null);
  const alertsPerPage = 5;
  const navigate = useNavigate();
  const location = useLocation();
  const highlightRef = useRef(null);
  const isAlertsPage = location.pathname === '/Alertes';

  useEffect(() => {
    // Vérifier si on a un ID d'alerte à mettre en évidence
    if (location.state && location.state.alertId) {
      setHighlightedAlertId(location.state.alertId);
      
      // Effacer l'état après utilisation pour éviter de mettre en évidence 
      // la même alerte lors des prochaines visites
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Fonction pour faire défiler jusqu'à l'alerte mise en évidence
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [highlightedAlertId, currentPage, alertsData]);

  // Fonction utilitaire pour compter les nouvelles alertes, utile pour les développements futurs
  const countNewAlerts = (alerts) => {
    const seenAlerts = JSON.parse(localStorage.getItem('seenAlerts') || '[]');
    const newAlerts = alerts.filter(
      (alert) => alert.status === 'Nouvelle' && !seenAlerts.includes(alert.alertFullId)
    );
    return newAlerts.length;
  };

  const markAlertsAsSeen = async (alerts) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const seenAlerts = JSON.parse(localStorage.getItem('seenAlerts') || '[]');
      const newSeenAlerts = alerts
        .filter(
          (alert) => alert.status === 'Nouvelle' && !seenAlerts.includes(alert.alertFullId)
        )
        .map((alert) => alert.alertFullId);

      if (newSeenAlerts.length > 0) {
        await Promise.all(
          newSeenAlerts.map((alertId) =>
            axios.put(
              `http://localhost:5000/api/alertes/${alertId}/status`,
              { status: 'Vue' },
              { headers }
            )
          )
        );

        const updatedSeenAlerts = [...new Set([...seenAlerts, ...newSeenAlerts])];
        localStorage.setItem('seenAlerts', JSON.stringify(updatedSeenAlerts));
        localStorage.setItem('newAlertsCount', '0');
        window.dispatchEvent(new CustomEvent('alertsUpdated'));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des alertes:', error);
      toast.error('Erreur lors de la mise à jour du statut des alertes');
    }
  };

  // Écouter l'événement personnalisé highlightAlert
  useEffect(() => {
    const handleHighlightAlert = (event) => {
      if (event.detail && event.detail.alertId) {
        setHighlightedAlertId(event.detail.alertId);
        
        // Rafraîchir les données pour s'assurer que l'alerte est dans la liste
        fetchAlertsData();
      }
    };

    window.addEventListener('highlightAlert', handleHighlightAlert);
    
    return () => {
      window.removeEventListener('highlightAlert', handleHighlightAlert);
    };
  }, []);
  
  // Extraire fetchAlertsData pour pouvoir le réutiliser
  const fetchAlertsData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get('http://localhost:5000/api/alertes', { headers });
      const { alerts } = response.data;

      if (!alerts) {
        console.error('Format de réponse invalide:', response.data);
        toast.error('Erreur de format des données');
        return;
      }

      const formattedAlerts = alerts.map((alert) => ({
        alertFullId: alert._id,
        message: alert.message,
        urgency: alert.urgency,
        status: alert.status,
        dueDate: new Date(alert.dueDate).toLocaleDateString(),
        vehicleName: alert.vehicle || 'Véhicule inconnu',
        vehicleId: alert.vehicleId,
        maintenanceTypeId: alert.maintenanceTypeId,
      }));

      setAlertsData(formattedAlerts);

      // Si nous avons un alertId dans l'état de location, trouver cette alerte
      if (highlightedAlertId) {
        const alertToHighlight = formattedAlerts.find(
          alert => alert.alertFullId === highlightedAlertId
        );
        
        if (alertToHighlight) {
          // Définir l'onglet actif en fonction du statut de l'alerte
          setActiveTab(alertToHighlight.status !== 'Toutes' ? alertToHighlight.status : 'Toutes');
          
          // Calculer la page où se trouve l'alerte
          const alertIndex = formattedAlerts.findIndex(
            alert => alert.alertFullId === highlightedAlertId
          );
          if (alertIndex !== -1) {
            const pageNumber = Math.floor(alertIndex / alertsPerPage) + 1;
            setCurrentPage(pageNumber);
          }
        }
      }

      const summaryData = {
        urgentes: formattedAlerts.filter((a) => a.urgency === 'Urgente').length,
        maintenance: formattedAlerts.filter((a) => a.maintenanceTypeId).length,
        diagnostics: formattedAlerts.filter((a) => !a.maintenanceTypeId).length,
      };
      setSummary(summaryData);

      if (isAlertsPage) {
        markAlertsAsSeen(formattedAlerts);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      toast.error('Erreur lors de la récupération des alertes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAlertsPage]);

  const handleScheduleMaintenance = (vehicleId, alertId) => {
    // Trouver l'alerte pour récupérer les informations complètes
    const alert = alertsData.find(a => a.alertFullId === alertId);
    
    // Déterminer le type d'intervention basé sur le message de l'alerte
    let typeIntervention = "Préventive";
    if (alert) {
      if (alert.message.includes("Vidange")) {
        typeIntervention = "Préventive";
      } else if (alert.message.includes("Anomalie") || alert.message.includes("Panne")) {
        typeIntervention = "Corrective";
      } else if (alert.message.includes("Contrôle")) {
        typeIntervention = "Périodique";
      }
    }
    
    // Obtenez les informations du véhicule
    const vehicleName = alert ? alert.vehicleName : "";
    
    // Naviguer vers la page de planification avec les informations pré-remplies
    navigate('/ScheduleMaintenance', { 
      state: { 
        vehicleId,
        vehicleName,
        alertId,
        typeIntervention,
        description: alert ? alert.message : "",
        currentKm: 0, // Vous pourriez essayer de récupérer cette valeur depuis l&apos;API si nécessaire
        nextDueKm: 0,
        urgence: alert && alert.urgency === "Urgente" ? true : false,
        importance: alert && alert.urgency === "Moyenne" ? true : false
      } 
    });
  };

  const handleUpdateAlertStatus = async (alertId, status) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(
        `http://localhost:5000/api/alertes/${alertId}/status`,
        { status },
        { headers }
      );
      
      // Mettre à jour les données localement
      setAlertsData(
        alertsData.map((alert) =>
          alert.alertFullId === alertId ? { ...alert, status } : alert
        )
      );
      
      toast.success(`Alerte marquée comme ${status}`);
      
      // Déclencher un événement pour informer d'autres composants du changement
      window.dispatchEvent(new CustomEvent('alertsUpdated'));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const filteredAlerts = alertsData.filter((alert) => {
    const matchesTab = activeTab === 'Toutes' || alert.status === activeTab;
    const matchesSearch = searchQuery
      ? alert.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesTab && matchesSearch;
  });

  const totalAlerts = filteredAlerts.length;
  const totalPages = Math.ceil(totalAlerts / alertsPerPage);
  const indexOfLastAlert = currentPage * alertsPerPage;
  const indexOfFirstAlert = indexOfLastAlert - alertsPerPage;
  const currentAlerts = filteredAlerts.slice(indexOfFirstAlert, indexOfLastAlert);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Urgente':
        return 'bg-red-100 text-red-600';
      case 'Moyenne':
        return 'bg-orange-100 text-orange-600';
      case 'Faible':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Nouvelle':
        return 'bg-blue-100 text-blue-600';
      case 'Vue':
        return 'bg-gray-100 text-gray-600';
      case 'Résolue':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes Urgentes</p>
              <p className="text-xl font-semibold text-gray-800">{summary.urgentes}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FontAwesomeIcon icon={faWrench} className="text-lg" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Maintenances à Planifier</p>
              <p className="text-xl font-semibold text-gray-800">{summary.maintenance}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FontAwesomeIcon icon={faCar} className="text-lg" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Diagnostics à Effectuer</p>
              <p className="text-xl font-semibold text-gray-800">{summary.diagnostics}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => { setActiveTab('Toutes'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-md ${
                  activeTab === 'Toutes'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => { setActiveTab('Nouvelle'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-md ${
                  activeTab === 'Nouvelle'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Nouvelles
              </button>
              <button
                onClick={() => { setActiveTab('Vue'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-md ${
                  activeTab === 'Vue'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Vues
              </button>
              <button
                onClick={() => { setActiveTab('Résolue'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-md ${
                  activeTab === 'Résolue'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Résolues
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-700">Chargement des alertes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'échéance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentAlerts.length > 0 ? (
                    currentAlerts.map((alert) => (
                      <tr 
                        key={alert.alertFullId} 
                        ref={alert.alertFullId === highlightedAlertId ? highlightRef : null}
                        className={`${alert.alertFullId === highlightedAlertId ? 'bg-yellow-50' : ''} 
                                    ${alert.alertFullId === highlightedAlertId ? 'animate-pulse' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {alert.alertFullId.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.vehicleName}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{alert.message}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(alert.urgency)}`}>
                            {alert.urgency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400" />
                            {alert.dueDate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {alert.status !== 'Résolue' && (
                            <>
                              <button
                                onClick={() => handleScheduleMaintenance(alert.vehicleId, alert.alertFullId)}
                                className="text-blue-600 hover:text-blue-900 mr-4 flex items-center"
                              >
                                <FontAwesomeIcon icon={faWrench} className="mr-1" />
                                Programmer
                              </button>
                              <button
                                onClick={() => handleUpdateAlertStatus(alert.alertFullId, 'Résolue')}
                                className="text-green-600 hover:text-green-900 flex items-center"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                Résoudre
                              </button>
                            </>
                          )}
                          {alert.status === 'Résolue' && (
                            <span className="flex items-center text-green-600">
                              <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                              Complété
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        Aucune alerte trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {totalAlerts > 0 && (
                <div className="flex justify-between items-center mt-4 p-4">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white'
                    }`}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                    Précédent
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white'
                    }`}
                  >
                    Suivant
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default AlertDashboard;
// Je vais implémenter un système de changement de langue en utilisant React Context et i18next. Voici les étapes que nous allons suivre :
// D'abord, installons les dépendances nécessaires
// Créer un contexte pour la langue
// Créer les fichiers de traduction
// Ajouter un bouton de changement de langue
// Intégrer le système dans l'application