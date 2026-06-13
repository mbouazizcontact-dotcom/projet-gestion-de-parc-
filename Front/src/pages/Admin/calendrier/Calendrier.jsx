import React, { useState, useCallback, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import moment from 'moment';
import { 
  X, 
  Trash2, 
  Calendar, 
  Search, 
  Loader2, 
  AlertCircle, 
  Filter, 
  Building, 
  User, 
  Car,
  Wrench,
  Clock
} from 'lucide-react';
import axios from '../../../Components/axios/axiosConfig';
import usePermissions from '../../../hooks/usePermissions';

moment.locale('fr');
const MySwal = withReactContent(Swal);

/**
 * MaintenanceCalendar - Composant de gestion et visualisation du calendrier des maintenances
 */
export default function MaintenanceCalendar() {
  // États principaux
  const [maintenanceReservations, setMaintenanceReservations] = useState([]);
  const [filteredMaintenances, setFilteredMaintenances] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [filteredMechanics, setFilteredMechanics] = useState([]);
  const [garages, setGarages] = useState([]);
  
  // États de filtre et sélection
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [selectedGarage, setSelectedGarage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  
  // États UI
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Custom hook pour gérer les permissions
  const { 
    permissions, 
    loading: permissionsLoading, 
    error: permissionsError, 
    hasPermission 
  } = usePermissions();

  // Configuration des toasts (memoized to prevent recreation)
  const toastConfig = useMemo(() => ({
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "rounded-lg shadow-md",
  }), []);

  // Fonction pour afficher des notifications d'erreur
  const showError = useCallback((message) => {
    toast.error(
      <div className="flex items-start">
        <AlertCircle className="mr-2 flex-shrink-0" size={18} />
        <span>{message}</span>
      </div>,
      toastConfig
    );
  }, [toastConfig]);

  // Fonction pour afficher des notifications de succès
  const showSuccess = useCallback((message) => {
    toast.success(message, toastConfig);
  }, [toastConfig]);

  // Récupération des données depuis l'API
  useEffect(() => {
    if (permissionsLoading || !hasPermission('Calendrier', 'lire')) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [maintenanceResponse, mechanicsResponse, garagesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/maintenance/maintenances'),
          axios.get('http://localhost:5000/api/mecaniciens'),
          axios.get('http://localhost:5000/api/garages')
        ]);

        // Inclure les maintenances avec statut "En cours", "Backlog" et "À faire"
        const validMaintenances = maintenanceResponse.data.filter(
          (m) => m.statut === 'En cours' || m.statut === 'Backlog' || m.statut === 'À faire'
        );
        setMaintenanceReservations(validMaintenances);
        setFilteredMaintenances(validMaintenances);
        setMechanics(mechanicsResponse.data);
        setFilteredMechanics(mechanicsResponse.data);
        setGarages(garagesResponse.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        
        if (error.response?.status === 401) {
          showError('Session expirée. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          const errorMessage = error.response?.data?.message || 'Erreur lors de la récupération des données.';
          setError(errorMessage);
          showError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [permissionsLoading, hasPermission, showError]);

  // Combinaison du filtrage des mécaniciens et des maintenances
  useEffect(() => {
    // Filtrage des mécaniciens
    let newFilteredMechanics = mechanics;
    if (selectedGarage) {
      newFilteredMechanics = mechanics.filter(
        (mechanic) => mechanic.garage?._id === selectedGarage
      );
      if (selectedMechanic && !newFilteredMechanics.some((m) => m._id === selectedMechanic)) {
        setSelectedMechanic('');
      }
    }
    setFilteredMechanics(newFilteredMechanics);

    // Filtrage des maintenances
    let filtered = maintenanceReservations;
    if (selectedGarage) {
      filtered = filtered.filter((m) => m.garage?._id === selectedGarage);
    }
    if (selectedMechanic) {
      filtered = filtered.filter((m) => m.mechanic?._id === selectedMechanic);
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((m) => m.statut === selectedStatus);
    }
    setFilteredMaintenances(filtered);
  }, [selectedGarage, selectedMechanic, selectedStatus, mechanics, maintenanceReservations]);

  // Couleur selon le statut pour le calendrier
  const getMaintenanceColor = (statut) => {
    switch (statut) {
      case 'Backlog':
        return '#3b82f6'; // Bleu
      case 'En cours':
        return '#f97316'; // Orange
      case 'À faire':
        return '#eab308'; // Jaune
      default:
        return '#10b981'; // Vert
    }
  };

  // Fonction pour récupérer l'icône correspondant au statut
  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'Backlog':
        return <Clock size={16} className="mr-1 text-blue-500" />;
      case 'En cours':
        return <Wrench size={16} className="mr-1 text-orange-500" />;
      case 'À faire':
        return <Calendar size={16} className="mr-1 text-yellow-500" />;
      default:
        return <Clock size={16} className="mr-1 text-emerald-500" />;
    }
  };

 

  // Sélection d'un événement du calendrier
  const handleSelectEvent = useCallback((event) => {
    const reservation = maintenanceReservations.find((r) => r._id === event.id);
    if (reservation) {
      setSelectedReservation(reservation);
      setShowDetailsModal(true);
    }
  }, [maintenanceReservations]);

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setSelectedGarage('');
    setSelectedMechanic('');
    setSelectedStatus('all');
  };

  // Rendu conditionnel pour le chargement et les erreurs de permission
  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-700">Chargement des permissions...</p>
        </div>
      </div>
    );
  }
  
  if (permissionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md border border-red-100">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-lg font-semibold">Erreur de permissions</h2>
          </div>
          <p className="text-gray-700">{permissionsError}</p>
        </div>
      </div>
    );
  }
  
  if (!hasPermission('Calendrier', 'lire')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md border border-red-100">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-lg font-semibold">Accès refusé</h2>
          </div>
          <p className="text-gray-700">
            Vous n'avez pas la permission de voir le calendrier des maintenances.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <ToastContainer {...toastConfig} />
        
        {/* En-tête avec titre et animation */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg shadow-sm">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Planification des Maintenances
            </h1>
          </div>
          
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden bg-white p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
            aria-label="Afficher les filtres"
          >
            <Filter size={20} className="text-gray-600" />
          </button>
        </div>
        
        {/* Section des filtres - Desktop */}
        <div className="hidden md:block mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center mb-4">
              <Filter size={18} className="text-blue-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-800">Filtres</h2>
              
              <button
                onClick={resetFilters}
                className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Réinitialiser
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Building size={16} className="text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Garage
                  </label>
                </div>
                <select
                  value={selectedGarage}
                  onChange={(e) => setSelectedGarage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-700 text-sm"
                >
                  <option value="">Tous les garages</option>
                  {garages.map((garage) => (
                    <option key={garage._id} value={garage._id}>
                      {garage.nom} ({garage.adresse})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <User size={16} className="text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Mécanicien
                  </label>
                </div>
                <select
                  value={selectedMechanic}
                  onChange={(e) => setSelectedMechanic(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-700 text-sm"
                  disabled={selectedGarage && filteredMechanics.length === 0}
                >
                  <option value="">Tous les mécaniciens</option>
                  {filteredMechanics.map((mechanic) => (
                    <option key={mechanic._id} value={mechanic._id}>
                      {mechanic.nom} {mechanic.prenom}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Wrench size={16} className="text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Statut
                  </label>
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-700 text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="Backlog">Backlog</option>
                  <option value="En cours">En cours</option>
                  <option value="À faire">À faire</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section des filtres - Mobile */}
        {showFiltersMobile && (
          <div className="md:hidden mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Filter size={16} className="text-blue-500 mr-2" />
                  <h2 className="font-medium text-gray-800">Filtres</h2>
                </div>
                <button
                  onClick={() => setShowFiltersMobile(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Building size={14} className="text-gray-500 mr-2" />
                    <label className="text-sm font-medium text-gray-700">
                      Garage
                    </label>
                  </div>
                  <select
                    value={selectedGarage}
                    onChange={(e) => setSelectedGarage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-700 text-sm"
                  >
                    <option value="">Tous les garages</option>
                    {garages.map((garage) => (
                      <option key={garage._id} value={garage._id}>
                        {garage.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User size={14} className="text-gray-500 mr-2" />
                    <label className="text-sm font-medium text-gray-700">
                      Mécanicien
                    </label>
                  </div>
                  <select
                    value={selectedMechanic}
                    onChange={(e) => setSelectedMechanic(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-700 text-sm"
                    disabled={selectedGarage && filteredMechanics.length === 0}
                  >
                    <option value="">Tous les mécaniciens</option>
                    {filteredMechanics.map((mechanic) => (
                      <option key={mechanic._id} value={mechanic._id}>
                        {mechanic.nom} {mechanic.prenom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Wrench size={14} className="text-gray-500 mr-2" />
                    <label className="text-sm font-medium text-gray-700">
                      Statut
                    </label>
                  </div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-700 text-sm"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="Backlog">Backlog</option>
                    <option value="En cours">En cours</option>
                    <option value="À faire">À faire</option>
                  </select>
                </div>
                
                <div className="flex justify-between pt-2">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 font-medium"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={() => setShowFiltersMobile(false)}
                    className="text-sm bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résumé des filtres appliqués */}
        {(selectedGarage || selectedMechanic || selectedStatus !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Filtres actifs:</span>
            
            {selectedGarage && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {garages.find(g => g._id === selectedGarage)?.nom || 'Garage'}
                <button 
                  onClick={() => setSelectedGarage('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            
            {selectedMechanic && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {filteredMechanics.find(m => m._id === selectedMechanic)?.nom || 'Mécanicien'}
                <button 
                  onClick={() => setSelectedMechanic('')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {selectedStatus}
                <button 
                  onClick={() => setSelectedStatus('all')}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Message d'erreur ou de chargement */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-6 w-6 text-blue-500 mr-3 animate-spin" />
            <span className="text-gray-600">Chargement des maintenances...</span>
          </div>
        )}
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Total des maintenances</p>
                <p className="text-xl font-semibold">{filteredMaintenances.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">En cours</p>
                <p className="text-xl font-semibold">
                  {filteredMaintenances.filter(m => m.statut === "En cours").length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">À faire</p>
                <p className="text-xl font-semibold">
                  {filteredMaintenances.filter(m => m.statut === "À faire").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={filteredMaintenances.map((res) => ({
              id: res._id,
              title: `${res.typeMaintenance?.nom} - ${res.vehicule?.immatriculation}`,
              start: new Date(res.datePrevue),
              end: moment(res.datePrevue).add(1, 'day').toDate(),
              backgroundColor: getMaintenanceColor(res.statut),
              borderColor: getMaintenanceColor(res.statut),
              textColor: '#ffffff',
              extendedProps: {
                status: res.statut,
                vehicule: res.vehicule,
                mechanic: res.mechanic,
                garage: res.garage
              }
            }))}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            locale={frLocale}
            eventClick={(info) => handleSelectEvent(info.event)}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            views={{
              dayGridMonth: { titleFormat: { year: 'numeric', month: 'long' } },
              timeGridWeek: { titleFormat: { year: 'numeric', month: 'long', day: 'numeric' } },
              timeGridDay: { titleFormat: { year: 'numeric', month: 'long', day: 'numeric' } },
              listWeek: { titleFormat: { year: 'numeric', month: 'long' } },
            }}
            height="700px"
            themeSystem="standard"
            dayMaxEvents={3}
            eventDisplay="block"
            firstDay={1}
            buttonText={{
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
              list: 'Liste'
            }}
          />
        </div>

        {/* Modal Détails */}
        {showDetailsModal && selectedReservation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-xl border border-gray-200 overflow-hidden animate-scaleIn">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <Car className="h-5 w-5 text-blue-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">Détails de la Maintenance</h2>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowDetailsModal(false)}
                  type="button"
                  disabled={isLoading}
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center mb-3">
                    <Wrench className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="font-medium text-blue-800">
                      {selectedReservation.typeMaintenance?.nom || 'Intervention'}
                    </h3>
                    <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getStatusIcon(selectedReservation.statut)}
                      {selectedReservation.statut}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500">Véhicule</span>
                      <span className="font-medium">
                        {selectedReservation.vehicule?.marque} {selectedReservation.vehicule?.modele}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Immatriculation</span>
                      <span className="font-medium">{selectedReservation.vehicule?.immatriculation}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date prévue</label>
                      <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">
                          {moment(selectedReservation.datePrevue).format('dddd D MMMM YYYY')}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de réservation</label>
                      <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">
                          {moment(selectedReservation.dateReservation).format('DD/MM/YYYY HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mécanicien</label>
                      <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">
                          {selectedReservation.mechanic
                            ? `${selectedReservation.mechanic.nom} ${selectedReservation.mechanic.prenom}`
                            : 'Non assigné'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Garage</label>
                      <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <Building className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">
                          {selectedReservation.garage
                            ? `${selectedReservation.garage.nom}`
                            : 'Non assigné'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 min-h-24">
                    {selectedReservation.notes || 'Aucune note pour cette intervention.'}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end items-center space-x-3">
                
                
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Message si aucune maintenance */}
        {!isLoading && filteredMaintenances.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100 mt-4">
            <div className="flex flex-col items-center justify-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune maintenance trouvée</h3>
              <p className="text-gray-500 max-w-sm">
                Aucune maintenance ne correspond à vos critères de recherche. Essayez de modifier vos filtres ou d'ajouter une nouvelle maintenance.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        
        .fc .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .fc .fc-button {
          background-color: #fff;
          border: 1px solid #e2e8f0;
          color: #4b5563;
          font-weight: 500;
          text-transform: capitalize;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          padding: 0.5rem 1rem;
        }
        
        .fc .fc-button:hover {
          background-color: #f9fafb;
        }
        
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        
        .fc-daygrid-day-number,
        .fc-col-header-cell-cushion {
          color: #4b5563;
          text-decoration: none !important;
        }
        
        .fc-day-today {
          background-color: rgba(59, 130, 246, 0.05) !important;
        }
        
        .fc-event {
          border-radius: 4px;
          border: none;
          padding: 2px 4px;
          font-size: 0.8rem;
          cursor: pointer;
        }
        
        .fc-event:hover {
          filter: brightness(0.9);
        }
        
        .fc-list-event-title {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}