import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInfoCircle,
  faSort,
  faSortUp,
  faSortDown,
  faEye,
  faGaugeHigh,
} from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import usePermissions from '../../hooks/usePermissions';
import { Download } from 'lucide-react';

const MySwal = withReactContent(Swal);

const renderEmptyValue = (value, type = 'text') => {
  if (value === undefined || value === null || value === '') {
    return (
      <span className="text-gray-400 italic text-sm">
        {type === 'date' ? 'Non définie' : 'Non renseigné'}
      </span>
    );
  }
  if (type === 'date' && value) {
    return new Date(value).toLocaleDateString();
  }
  return value;
};

const renderTableCell = (value, type = 'text', fieldName = '') => {
  if (value === undefined || value === null || value === '') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-400">—</span>
        <span className="text-gray-400 text-xs" title={`${fieldName} non renseigné`}>
          <FontAwesomeIcon icon={faInfoCircle} className="text-gray-300 hover:text-gray-500 cursor-help" />
        </span>
      </div>
    );
  }
  if (type === 'date' && value) {
    return new Date(value).toLocaleDateString();
  }
  return value;
};

const VehiculeTable = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ViewAll = location.pathname === '/Vehicules';
  const { permissions, loading, hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [groupeSearchQuery, setGroupeSearchQuery] = useState('');
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedVehicle, setSelectedVehicle] = useState({
    numero: 1,
    marque: '',
    modele: '',
    immatriculation: '',
    mec: '',
    etat: 'Fonctionnel',
    proprietaire: '',
    numChassis: '',
    typeMines: '',
    kilometrage: '',
    conducteur: '',
    age: 0,
    dossier: null,
    documentUrl: '',
  });
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [isMileageOnlyMode, setIsMileageOnlyMode] = useState(false);
  const [VEHICULES, setVEHICULES] = useState([]);
  const [CONDUCTEURS, setCONDUCTEURS] = useState([]);
  const [GROUPES, setGROUPES] = useState([]);
  const [nextVehicleNumber, setNextVehicleNumber] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDocumentUrl, setModalDocumentUrl] = useState('');

  const VehiclesPerPage = ViewAll ? VEHICULES.length : 6;

  useEffect(() => {
    if (loading || !hasPermission('vehicules', 'lire')) return;

    let isMounted = true;

    const fetchVehicles = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get('http://localhost:5000/api/vehicules/all', {
          headers,
          params: { populate: 'proprietaire conducteur' },
        });

        let vehiclesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        if (!Array.isArray(vehiclesData)) {
          console.warn('Unexpected response format:', response.data);
          vehiclesData = [];
        }

        if (isMounted) {
          const numberedVehicles = vehiclesData
            .map((vehicle, index) => ({
              ...vehicle,
              numero: vehicle.numero || index + 1,
            }))
            .sort((a, b) => a.numero - b.numero);
          setVEHICULES(numberedVehicles);
        }
      } catch (error) {
        console.error('Erreur fetchVehicles:', error);
        toast.error('Échec du chargement des véhicules');
      }
    };

    const fetchConducteurs = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get('http://localhost:5000/api/drivers', { headers });
        let driversData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        if (!Array.isArray(driversData)) {
          console.warn('fetchConducteurs: response.data n\'est pas un tableau', driversData);
          driversData = [];
        }
        if (isMounted) setCONDUCTEURS(driversData);
      } catch (error) {
        console.error('Erreur fetchConducteurs:', error);
        toast.error('Échec du chargement des conducteurs');
      }
    };

    const fetchGroupes = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get('http://localhost:5000/api/groupes', { headers });
        let groupesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        if (!Array.isArray(groupesData)) {
          console.warn('fetchGroupes: response.data n\'est pas un tableau', groupesData);
          groupesData = [];
        }
        if (isMounted) setGROUPES(groupesData);
      } catch (error) {
        console.error('Erreur fetchGroupes:', error);
        toast.error('Échec du chargement des groupes');
        if (isMounted) setGROUPES([]);
      }
    };

    fetchVehicles();
    fetchConducteurs();
    fetchGroupes();

    const handleRefreshVehicles = () => {
      fetchVehicles();
    };
    window.addEventListener('refreshVehicles', handleRefreshVehicles);

    return () => {
      isMounted = false;
      window.removeEventListener('refreshVehicles', handleRefreshVehicles);
    };
  }, [hasPermission, loading]);

  useEffect(() => {
    if (VEHICULES.length > 0) {
      const maxNumber = Math.max(...VEHICULES.map((v) => v.numero || 0));
      setNextVehicleNumber(maxNumber + 1);
      setSelectedVehicle((prev) => ({ ...prev, numero: maxNumber + 1 }));
    } else {
      setNextVehicleNumber(1);
      setSelectedVehicle((prev) => ({ ...prev, numero: 1 }));
    }
  }, [VEHICULES]);

  const filteredVehicles = VEHICULES.filter((vehicle) => {
    if (!searchQuery && !groupeSearchQuery && !driverSearchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const matchesMainSearch =
      !searchQuery ||
      (vehicle.marque || '').toString().toLowerCase().includes(searchLower) ||
      (vehicle.modele || '').toString().toLowerCase().includes(searchLower) ||
      (vehicle.immatriculation || '').toString().toLowerCase().includes(searchLower);

    const matchesGroupeSearch = !groupeSearchQuery || vehicle.proprietaire?._id === groupeSearchQuery;

    const matchesDriverSearch = !driverSearchQuery || vehicle.conducteur?._id === driverSearchQuery;

    return matchesMainSearch && matchesGroupeSearch && matchesDriverSearch;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn] ?? '';
    const bValue = b[sortColumn] ?? '';

    if (sortColumn === 'mec') {
      const aDate = aValue ? new Date(aValue) : null;
      const bDate = bValue ? new Date(bValue) : null;
      if (!aDate && !bDate) return 0;
      if (!aDate) return sortDirection === 'asc' ? -1 : 1;
      if (!bDate) return sortDirection === 'asc' ? 1 : -1;
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }
    if (sortColumn === 'kilometrage' || sortColumn === 'numero' || sortColumn === 'age') {
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }
    if (sortColumn === 'conducteur') {
      const aName = a.conducteur ? `${a.conducteur.prenom} ${a.conducteur.nom}` : '';
      const bName = b.conducteur ? `${b.conducteur.prenom} ${b.conducteur.nom}` : '';
      return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
    }
    if (sortColumn === 'proprietaire') {
      const aName = a.proprietaire?.nom || '';
      const bName = b.proprietaire?.nom || '';
      return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
    }

    return sortDirection === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const totalPages = Math.ceil(sortedVehicles.length / VehiclesPerPage);
  const indexOfLastVehicle = currentPage * VehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - VehiclesPerPage;
  const currentVehicles = ViewAll
    ? sortedVehicles
    : sortedVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const exporterCSV = () => {
    const headers = [
      "Numéro",
      "Marque",
      "Modèle",
      "Immatriculation",
      "Date MEC",
      "Âge",
      "État",
      "Groupe/Propriétaire",
      "Numéro de châssis",
      "Type mines",
      "Kilométrage",
      "Conducteur",
      "Document URL",
    ];
    const rows = sortedVehicles.map(vehicle => [
      vehicle.numero || 'N/A',
      vehicle.marque || 'Non spécifié',
      vehicle.modele || 'Non spécifié',
      vehicle.immatriculation || 'Non spécifié',
      vehicle.mec ? new Date(vehicle.mec).toLocaleDateString() : 'Non définie',
      vehicle.age !== undefined && vehicle.age !== null ? `${vehicle.age} an${vehicle.age > 1 ? 's' : ''}` : 'Non calculé',
      vehicle.etat || 'Indéfini',
      vehicle.proprietaire?.nom || 'Non spécifié',
      vehicle.numChassis || 'Non spécifié',
      vehicle.typeMines || 'Non spécifié',
      vehicle.kilometrage !== undefined && vehicle.kilometrage !== null && vehicle.kilometrage !== '' ? `${vehicle.kilometrage} km` : 'Non spécifié',
      vehicle.conducteur ? `${vehicle.conducteur.prenom} ${vehicle.conducteur.nom}` : 'Non spécifié',
      vehicle.documentUrl || 'Aucun document',
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "vehicules_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddVehicle = () => {
    if (!hasPermission('vehicules', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un véhicule.");
      return;
    }
    setIsMileageOnlyMode(false);
    setSelectedVehicle({
      numero: nextVehicleNumber,
      marque: '',
      modele: '',
      immatriculation: '',
      mec: '',
      etat: 'Fonctionnel',
      proprietaire: '',
      numChassis: '',
      typeMines: '',
      kilometrage: '',
      conducteur: '',
      age: 0,
      dossier: null,
      documentUrl: '',
    });
    setShowAddVehicleForm(true);
  };

  const handleEditVehicle = (vehicle) => {
    if (!hasPermission('vehicules', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un véhicule.");
      return;
    }
    setIsMileageOnlyMode(false);
    setSelectedVehicle({
      id: vehicle._id,
      numero: vehicle.numero || nextVehicleNumber,
      marque: vehicle.marque || '',
      modele: vehicle.modele || '',
      immatriculation: vehicle.immatriculation || '',
      mec: vehicle.mec ? new Date(vehicle.mec).toISOString().split('T')[0] : '',
      etat: vehicle.etat || 'Fonctionnel',
      proprietaire: vehicle.proprietaire?._id || '',
      numChassis: vehicle.numChassis || '',
      typeMines: vehicle.typeMines || '',
      kilometrage: vehicle.kilometrage || '',
      conducteur: vehicle.conducteur?._id || '',
      age: vehicle.age || 0,
      dossier: null,
      documentUrl: vehicle.documentUrl || '',
    });
    setShowAddVehicleForm(true);
  };

  const handleEditMileage = (vehicle) => {
    if (!hasPermission('vehicules', 'modifierKilometrage')) {
      toast.error("Vous n'avez pas la permission de modifier le kilométrage.");
      return;
    }
    setIsMileageOnlyMode(true);
    setSelectedVehicle({
      id: vehicle._id,
      numero: vehicle.numero || nextVehicleNumber,
      marque: vehicle.marque || '',
      modele: vehicle.modele || '',
      immatriculation: vehicle.immatriculation || '',
      mec: vehicle.mec ? new Date(vehicle.mec).toISOString().split('T')[0] : '',
      etat: vehicle.etat || 'Fonctionnel',
      proprietaire: vehicle.proprietaire?._id || '',
      numChassis: vehicle.numChassis || '',
      typeMines: vehicle.typeMines || '',
      kilometrage: vehicle.kilometrage || '',
      conducteur: vehicle.conducteur?._id || '',
      age: vehicle.age || 0,
      dossier: null,
      documentUrl: vehicle.documentUrl || '',
    });
    setShowAddVehicleForm(true);
  };

  const handleTableView = () => {
    setShowAddVehicleForm(false);
    setIsMileageOnlyMode(false);
    setSelectedVehicle({
      numero: nextVehicleNumber,
      marque: '',
      modele: '',
      immatriculation: '',
      mec: '',
      etat: 'Fonctionnel',
      proprietaire: '',
      numChassis: '',
      typeMines: '',
      kilometrage: '',
      conducteur: '',
      age: 0,
      dossier: null,
      documentUrl: '',
    });
  };

  const validateDocument = () => {
    if (!selectedVehicle.dossier) {
      if (!selectedVehicle.id) {
        toast.error('Un dossier (ZIP ou PDF) est requis pour ajouter un véhicule.');
        return false;
      }
      return true;
    }
    const validTypes = ['application/zip', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(selectedVehicle.dossier.type)) {
      toast.error('Le dossier doit être un fichier ZIP ou PDF.');
      return false;
    }
    if (selectedVehicle.dossier.size > maxSize) {
      toast.error('Le dossier ne doit pas dépasser 10 Mo.');
      return false;
    }
    return true;
  };

  const handleAddVehicleSuccess = async () => {
    if (!hasPermission('vehicules', selectedVehicle.id ? isMileageOnlyMode ? 'modifierKilometrage' : 'modifier' : 'creer')) {
      toast.error(
        `Vous n'avez pas la permission de ${selectedVehicle.id ? isMileageOnlyMode ? 'modifier le kilométrage' : 'modifier' : 'ajouter'} un véhicule.`
      );
      return;
    }
  
    if (isMileageOnlyMode) {
      const km = Number(selectedVehicle.kilometrage);
      if (selectedVehicle.kilometrage === '' || isNaN(km) || km < 0 || !Number.isInteger(km)) {
        toast.error('Le kilométrage doit être un nombre entier positif.');
        return;
      }
  
      const result = await MySwal.fire({
        title: 'Confirmer la modification',
        text: 'Êtes-vous sûr de vouloir modifier le kilométrage de ce véhicule ?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, confirmer',
        cancelButtonText: 'Annuler',
      });
  
      if (!result.isConfirmed) return;
  
      try {
        const token = sessionStorage.getItem('token');
        const headers = {
          Authorization: token ? `Bearer ${token}` : undefined,
        };
  
        const formData = new FormData();
        formData.append('kilometrage', km);
  
        await axios.put(`http://localhost:5000/api/vehicules/${selectedVehicle.id}`, formData, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        });
  
        Swal.fire({
          title: 'Kilométrage modifié',
          text: 'Le kilométrage a été mis à jour avec succès !',
          icon: 'success',
        });
  
        await fetchVehicles();
        setShowAddVehicleForm(false);
        setIsMileageOnlyMode(false);
        setSelectedVehicle({
          numero: nextVehicleNumber,
          marque: '',
          modele: '',
          immatriculation: '',
          mec: '',
          etat: 'Fonctionnel',
          proprietaire: '',
          numChassis: '',
          typeMines: '',
          kilométrage: '',
          conducteur: '',
          age: 0,
          dossier: null,
          documentUrl: '',
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour du kilométrage:', error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.errors?.join(', ') ||
          error.response?.data?.erreur ||
          'Erreur lors de la mise à jour du kilométrage. Veuillez réessayer.';
        toast.error(errorMessage, { autoClose: 5000 });
      }
    } else {
      const requiredFields = [
        { key: 'marque', label: 'Marque' },
        { key: 'modele', label: 'Modèle' },
        { key: 'immatriculation', label: 'Immatriculation' },
        { key: 'mec', label: 'Date de mise en circulation' },
        { key: 'etat', label: 'État' },
        { key: 'proprietaire', label: 'Propriétaire' },
        { key: 'numChassis', label: 'Numéro de châssis' },
      ];
  
      if (!selectedVehicle.id) {
        requiredFields.push({ key: 'kilometrage', label: 'Kilométrage' });
      }
  
      const missingFields = requiredFields.filter(
        (field) => selectedVehicle[field.key] == null || selectedVehicle[field.key] === ''
      );
      if (missingFields.length > 0) {
        toast.error(
          `Champs requis manquants: ${missingFields.map((field) => field.label).join(', ')}`
        );
        return;
      }
  
      const km = Number(selectedVehicle.kilometrage);
      if (!selectedVehicle.id) {
        if (isNaN(km) || km < 0 || !Number.isInteger(km)) {
          toast.error('Le kilométrage doit être un nombre entier positif.');
          return;
        }
      }
  
      const mecDate = new Date(selectedVehicle.mec);
      if (isNaN(mecDate.getTime())) {
        toast.error('La date de mise en circulation (MEC) est invalide.');
        return;
      }
  
      if (!GROUPES.some((g) => g._id === selectedVehicle.proprietaire)) {
        toast.error('Le groupe/propriétaire sélectionné est invalide.');
        return;
      }
  
      if (
        selectedVehicle.conducteur &&
        !CONDUCTEURS.some((c) => c._id === selectedVehicle.conducteur)
      ) {
        toast.error('Le conducteur sélectionné est invalide.');
        return;
      }
  
      if (!validateDocument()) return;
  
      const isEdit = !!selectedVehicle.id;
      const confirmationMessage = isEdit
        ? 'Êtes-vous sûr de vouloir modifier ce véhicule ?'
        : 'Êtes-vous sûr de vouloir ajouter ce véhicule ?';
  
      const result = await MySwal.fire({
        title: `Confirmer ${isEdit ? 'la modification' : "l'ajout"}`,
        text: confirmationMessage,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, confirmer',
        cancelButtonText: 'Annuler',
      });
  
      if (!result.isConfirmed) return;
  
      try {
        const token = sessionStorage.getItem('token');
        const headers = {
          Authorization: token ? `Bearer ${token}` : undefined,
        };
  
        const formData = new FormData();
        formData.append('numero', selectedVehicle.numero);
        formData.append('marque', selectedVehicle.marque);
        formData.append('modele', selectedVehicle.modele);
        formData.append('immatriculation', selectedVehicle.immatriculation);
        formData.append('mec', mecDate.toISOString());
        formData.append('etat', selectedVehicle.etat);
        formData.append('proprietaire', selectedVehicle.proprietaire);
        formData.append('numChassis', selectedVehicle.numChassis);
        formData.append('typeMines', selectedVehicle.typeMines || '');
        if (!selectedVehicle.id) {
          formData.append('kilometrage', Number(selectedVehicle.kilometrage) || 0);
        }
        if (selectedVehicle.conducteur) {
          formData.append('conducteur', selectedVehicle.conducteur);
        }
        if (selectedVehicle.dossier) {
          formData.append('dossier', selectedVehicle.dossier);
        }
  
        const url = isEdit
          ? `http://localhost:5000/api/vehicules/${selectedVehicle.id}`
          : `http://localhost:5000/api/vehicules`;
  
        const response = await axios({
          method: isEdit ? 'put' : 'post',
          url: url,
          data: formData,
          headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        });
  
        Swal.fire({
          title: isEdit ? 'Véhicule modifié' : 'Véhicule ajouté',
          text: 'Opération réussie !',
          icon: 'success',
        });
  
        await fetchVehicles();
        setShowAddVehicleForm(false);
        setIsMileageOnlyMode(false);
        setSelectedVehicle({
          numero: nextVehicleNumber + 1,
          marque: '',
          modele: '',
          immatriculation: '',
          mec: '',
          etat: 'Fonctionnel',
          proprietaire: '',
          numChassis: '',
          typeMines: '',
          kilometrage: '',
          conducteur: '',
          age: 0,
          dossier: null,
          documentUrl: '',
        });
      } catch (error) {
        console.error('Erreur lors de l\'opération:', error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.erreur ||
          'Erreur lors de l\'opération. Veuillez réessayer.';
        toast.error(errorMessage, { autoClose: 5000 });
      }
    }
  };

  const handleSupprimer = async (vehicleId) => {
    if (!hasPermission('vehicules', 'supprimer')) {
      toast.error("Vous n'avez pas la permission de supprimer un véhicule.");
      return;
    }

    const result = await MySwal.fire({
      title: 'Confirmer la suppression',
      text: 'Êtes-vous sûr de vouloir supprimer ce véhicule ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (!result.isConfirmed) return;

    try {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`http://localhost:5000/api/vehicules/${vehicleId}`, { headers });

      Swal.fire('Supprimé !', 'Le véhicule a été supprimé.', 'success');
      await fetchVehicles();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      const errorMessage =
        error.response?.data?.message || 'Erreur lors de la suppression du véhicule.';
      toast.error(errorMessage);
    }
  };

  const openDocumentsModal = (documentUrl) => {
    setModalDocumentUrl(documentUrl);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDocumentsModal = () => {
    setIsModalOpen(false);
    setModalDocumentUrl('');
    document.body.style.overflow = 'auto';
  };

  const fetchVehicles = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get('http://localhost:5000/api/vehicules/all', {
        headers,
        params: { populate: 'proprietaire conducteur' },
      });

      let vehiclesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      if (!Array.isArray(vehiclesData)) {
        console.warn('Unexpected response format:', response.data);
        vehiclesData = [];
      }

      const numberedVehicles = vehiclesData
        .map((vehicle, index) => ({
          ...vehicle,
          numero: vehicle.numero || index + 1,
        }))
        .sort((a, b) => a.numero - b.numero);

      setVEHICULES(numberedVehicles);
      return numberedVehicles;
    } catch (error) {
      console.error('Erreur fetchVehicles:', error);
      const errorMessage =
        error.response?.data?.message || 'Échec du chargement des véhicules.';
      toast.error(errorMessage);
      return [];
    }
  };

  const renderAddVehicleForm = () => (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        {isMileageOnlyMode
          ? 'Modifier Kilométrage'
          : selectedVehicle.id
          ? 'Modifier Véhicule'
          : 'Ajouter Nouveau Véhicule'}
      </h2>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddVehicleSuccess();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Numéro</label>
            <input
              type="number"
              value={selectedVehicle.numero}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Marque*</label>
            <input
              type="text"
              value={selectedVehicle.marque}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, marque: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required={!selectedVehicle.id && !isMileageOnlyMode}
              disabled={isMileageOnlyMode}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Modèle*</label>
            <input
              type="text"
              value={selectedVehicle.modele}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, modele: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required={!selectedVehicle.id && !isMileageOnlyMode}
              disabled={isMileageOnlyMode}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Immatriculation*</label>
            <input
              type="text"
              value={selectedVehicle.immatriculation}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, immatriculation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required={!selectedVehicle.id && !isMileageOnlyMode}
              disabled={isMileageOnlyMode}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Date MEC*</label>
            <input
              type="date"
              value={selectedVehicle.mec}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, mec: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required={!selectedVehicle.id && !isMileageOnlyMode}
              disabled={isMileageOnlyMode}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">État*</label>
            <select
              value={selectedVehicle.etat}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, etat: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required={!selectedVehicle.id && !isMileageOnlyMode}
              disabled={isMileageOnlyMode}
            >
              <option value="Fonctionnel">Fonctionnel</option>
              <option value="Reparation">En réparation</option>
              <option value="Accidenté">Accidenté</option>
              <option value="stock">En stock</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Groupe/Propriétaire*</label>
            <select
              value={selectedVehicle.proprietaire}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, proprietaire: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required={!selectedVehicle.id && !isMileageOnlyMode}
              disabled={isMileageOnlyMode}
            >
              <option value="">Sélectionner un groupe</option>
              {Array.isArray(GROUPES) ? (
                GROUPES.map((groupe) => (
                  <option key={groupe._id} value={groupe._id}>
                    {groupe.nom || 'Groupe sans nom'}
                  </option>
                ))
              ) : (
                <option disabled>Aucun groupe disponible</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Numéro de châssis*</label>
            <input
              type="text"
              value={selectedVehicle.numChassis}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, numChassis: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required={!selectedVehicle.id && !isMileageOnlyMode}
              disabled={isMileageOnlyMode}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Type mines</label>
            <input
              type="text"
              value={selectedVehicle.typeMines}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, typeMines: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isMileageOnlyMode}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Kilométrage{isMileageOnlyMode ? '*' : !selectedVehicle.id ? '*' : ''}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={selectedVehicle.kilometrage}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (Number(value) >= 0 && Number.isInteger(Number(value)))) {
                  setSelectedVehicle({ ...selectedVehicle, kilometrage: value });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required={isMileageOnlyMode || !selectedVehicle.id}
              readOnly={selectedVehicle.id && !isMileageOnlyMode}
              disabled={selectedVehicle.id && !isMileageOnlyMode}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Conducteur</label>
            <select
              value={selectedVehicle.conducteur}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, conducteur: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isMileageOnlyMode}
            >
              <option value="">Sélectionner un conducteur</option>
              {Array.isArray(CONDUCTEURS) ? (
                CONDUCTEURS.map((conducteur) => (
                  <option key={conducteur._id} value={conducteur._id}>
                    {conducteur.prenom} {conducteur.nom}
                  </option>
                ))
              ) : (
                <option disabled>Aucun conducteur disponible</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Dossier (ZIP ou PDF) {selectedVehicle.id ? '' : !isMileageOnlyMode ? <span className="text-red-500">*</span> : ''}
            </label>
            <div className="relative">
              <input
                type="file"
                id="dossier"
                name="dossier"
                accept="application/zip,application/pdf"
                onChange={(e) => setSelectedVehicle({ ...selectedVehicle, dossier: e.target.files[0] })}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                disabled={isMileageOnlyMode}
              />
              <div className={`w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white text-gray-500 hover:bg-gray-50 transition duration-150 ease-in-out ${isMileageOnlyMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                <span>{selectedVehicle.dossier ? selectedVehicle.dossier.name : 'Choisir un fichier'}</span>
                <span className="text-blue-600 font-semibold">Parcourir</span>
              </div>
            </div>
            {selectedVehicle.id && selectedVehicle.documentUrl && !selectedVehicle.dossier && (
              <div className="mt-2">
                <a
                  href={selectedVehicle.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Voir le Document
                </a>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full"
          >
            {isMileageOnlyMode
              ? 'Modifier Kilométrage'
              : selectedVehicle.id
              ? 'Modifier Véhicule'
              : 'Ajouter Véhicule'}
          </button>
          <button
            onClick={handleTableView}
            type="button"
            className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 w-full"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (!hasPermission('vehicules', 'lire')) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir la liste des véhicules.
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen transition-all duration-300 ${isModalOpen ? 'overflow-hidden' : ''}`}>
      <div className={`transition-all duration-300 ${isModalOpen ? 'filter blur-md' : ''}`}>
        <div className="p-8 bg-white rounded-lg shadow-lg">
          {showAddVehicleForm ? (
            renderAddVehicleForm()
          ) : (
            <>
              <div className="flex justify-between items-center pb-6 border-gray-200">
                <div>
                  <h2 className="text-3xl font-semibold text-gray-800">Liste des Véhicules</h2>
                  <p className="text-md text-gray-500">
                    {ViewAll ? 'Affichage de tous les véhicules' : 'Affichage partiel des véhicules'}
                  </p>
                </div>
                <div className="ml-auto justify-between flex items-center space-x-3">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Rechercher par Marque ou Modèle"
                      className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select
                      className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={groupeSearchQuery}
                      onChange={(e) => setGroupeSearchQuery(e.target.value)}
                    >
                      <option value="">Tous les groupes</option>
                      {Array.isArray(GROUPES) ? (
                        GROUPES.map((groupe) => (
                          <option key={groupe._id} value={groupe._id}>
                            {groupe.nom || 'Groupe sans nom'}
                          </option>
                        ))
                      ) : (
                        <option disabled>Aucun groupe disponible</option>
                      )}
                    </select>
                    <select
                      className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={driverSearchQuery}
                      onChange={(e) => setDriverSearchQuery(e.target.value)}
                    >
                      <option value="">Tous les conducteurs</option>
                      {Array.isArray(CONDUCTEURS) ? (
                        CONDUCTEURS.map((conducteur) => (
                          <option key={conducteur._id} value={conducteur._id}>
                            {conducteur.prenom} {conducteur.nom}
                          </option>
                        ))
                      ) : (
                        <option disabled>Aucun conducteur disponible</option>
                      )}
                    </select>
                  </div>
                  <div className="flex space-x-3">
                    {hasPermission('vehicules', 'creer') && (
                      <button
                        onClick={handleAddVehicle}
                        className="bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition duration-300"
                      >
                        AJOUTER UN VÉHICULE
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col mt-6">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th
                              scope="col"
                              className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('numero')}
                            >
                              N°{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'numero'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('marque')}
                            >
                              Marque{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'marque'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('modele')}
                            >
                              Modèle{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'modele'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-2 py-2 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('immatriculation')}
                            >
                              Immatriculation{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'immatriculation'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('mec')}
                            >
                              MEC{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'mec'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('age')}
                            >
                              Âge{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'age'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-12 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('etat')}
                            >
                              État{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'etat'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('proprietaire')}
                            >
                              Groupe{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'proprietaire'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('numChassis')}
                            >
                              NUM_CHASSIS{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'numChassis'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('typeMines')}
                            >
                              TYPE_MINES{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'typeMines'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('kilometrage')}
                            >
                              Kilométrage{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'kilometrage'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer"
                              onClick={() => handleSort('conducteur')}
                            >
                              Conducteur{' '}
                              <FontAwesomeIcon
                                icon={
                                  sortColumn === 'conducteur'
                                    ? sortDirection === 'asc'
                                      ? faSortUp
                                      : faSortDown
                                    : faSort
                                }
                              />
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                            >
                              Document
                            </th>
                            <th scope="col" className="relative py-3.5 px-4">
                              <span className="font-normal">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                          {currentVehicles.length > 0 ? (
                            currentVehicles.map((vehicle, index) => (
                              <tr key={index}>
                                <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                  {vehicle.numero}
                                </td>
                                <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                  <div className="inline-flex items-center gap-x-3">
                                    <div className="flex items-center gap-x-2">
                                      <h2 className="font-medium text-gray-800 dark:text-white">
                                        {renderTableCell(vehicle.marque, 'text', 'Marque')}
                                      </h2>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                  <div className="inline-flex items-center gap-x-3">
                                    <div className="flex items-center gap-x-2">
                                      <h2 className="font-medium text-gray-800 dark:text-white">
                                        {renderTableCell(vehicle.modele, 'text', 'Modèle')}
                                      </h2>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  {renderTableCell(vehicle.immatriculation, 'text', 'Immatriculation')}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  {renderTableCell(vehicle.mec, 'date', 'Date de mise en circulation')}
                                </td>
                                <td className="px-4 py-4 text-sm whitespace-nowrap">
                                  <div className="flex items-center gap-x-2">
                                    {vehicle.age !== undefined && vehicle.age !== null ? (
                                      <p className="px-4 py-1 text-xs text-indigo-500 rounded-full dark:bg-gray-800 bg-indigo-100/60">
                                        {vehicle.age} {vehicle.age > 1 ? 'ans' : 'an'}
                                      </p>
                                    ) : (
                                      <p className="px-4 py-1 text-xs text-gray-400 rounded-full dark:bg-gray-800 bg-gray-100/60">
                                        Non calculé
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-12 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                  <div
                                    className={`inline-flex items-center px-3 py-1 rounded-full gap-x-2 
                                    ${vehicle.etat === 'Fonctionnel' ? 'bg-emerald-100/60 text-emerald-500' : vehicle.etat === 'Reparation' ? 'bg-yellow-100/60 text-yellow-500' : vehicle.etat === 'Accidenté' ? 'bg-red-100/60 text-red-500' : vehicle.etat === 'stock' ? 'bg-blue-100/60 text-blue-500' : 'bg-gray-100/60 text-gray-500'}`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full 
                                      ${vehicle.etat === 'Fonctionnel' ? 'bg-emerald-500' : vehicle.etat === 'Reparation' ? 'bg-yellow-500' : vehicle.etat === 'Accidenté' ? 'bg-red-500' : vehicle.etat === 'stock' ? 'bg-blue-500' : 'bg-gray-500'}`}
                                    ></span>
                                    <h2 className="text-sm font-normal">{vehicle.etat || 'Indéfini'}</h2>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  {renderTableCell(vehicle.proprietaire?.nom, 'text', 'Groupe')}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  {renderTableCell(vehicle.numChassis, 'text', 'Numéro de châssis')}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  {renderTableCell(vehicle.typeMines, 'text', 'Type mines')}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  {vehicle.kilometrage !== undefined && vehicle.kilometrage !== null && vehicle.kilometrage !== '' ? (
                                    <span>{vehicle.kilometrage} km</span>
                                  ) : (
                                    renderTableCell(null, 'text', 'Kilométrage')
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  {vehicle.conducteur?.prenom && vehicle.conducteur?.nom
                                    ? `${vehicle.conducteur.prenom} ${vehicle.conducteur.nom}`
                                    : renderTableCell(null, 'text', 'Conducteur')}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                  {vehicle.documentUrl ? (
                                    <button
                                      onClick={() => openDocumentsModal(vehicle.documentUrl)}
                                      className="text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Voir le Document"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                                    </button>
                                  ) : (
                                    renderTableCell(null, 'text', 'Document')
                                  )}
                                </td>
                                <td className="px-4 py-4 text-sm whitespace-nowrap">
                                  <div className="flex items-center gap-x-6">
                                    {hasPermission('vehicules', 'supprimer') && (
                                      <button
                                        onClick={() => handleSupprimer(vehicle._id || vehicle.id)}
                                        className="text-gray-500 transition-colors duration-200 dark:hover:text-red-500 dark:text-gray-300 hover:text-red-500 focus:outline-none"
                                        title="Supprimer"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          strokeWidth="1.5"
                                          stroke="currentColor"
                                          className="w-5 h-5"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                          />
                                        </svg>
                                      </button>
                                    )}
                                    {hasPermission('vehicules', 'modifier') && (
                                      <button
                                        onClick={() => handleEditVehicle(vehicle)}
                                        className="text-gray-500 transition-colors duration-200 dark:hover:text-yellow-500 dark:text-gray-300 hover:text-yellow-500 focus:outline-none"
                                        title="Modifier Véhicule"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          strokeWidth="1.5"
                                          stroke="currentColor"
                                          className="w-5 h-5"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                          />
                                        </svg>
                                      </button>
                                    )}
                                    {hasPermission('vehicules', 'modifier') && (
                                      <button
                                        onClick={() => handleEditMileage(vehicle)}
                                        className="text-gray-500 transition-colors duration-200 dark:hover:text-blue-500 dark:text-gray-300 hover:text-blue-500 focus:outline-none"
                                        title="Modifier Kilométrage"
                                      >
                                        <FontAwesomeIcon icon={faGaugeHigh} className="w-5 h-5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="14" className="text-center py-6">
                                <div className="relative">
                                  <div className="flex flex-col items-center justify-center space-y-2">
                                    <p className="text-gray-600 text-lg">Aucun véhicule trouvé.</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex mt-6 items-center justify-between'>
                <div className=" flex text-sm text-gray-600">
                  Total des véhicules : <span className="font-medium ml-1">{sortedVehicles.length}</span>
                </div>

                <div className="">
                  {!ViewAll && totalPages > 1 && (
                    <div className="flex w-full justify-between items-center  ">
                      <button
                        className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                      >
                        <span className="mr-2">←</span>PRÉCÉDENTE
                      </button>
                      <span className="text-sm text-gray-500 mx-4">
                        Page {currentPage} sur {totalPages || 1}
                      </span>
                      <button
                        className="px-5 py-2 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        SUIVANTE <span className="ml-2">→</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex ">
                  <button
                    onClick={exporterCSV}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300"
                    aria-label="Exporter en CSV"
                  >
                    <Download size={16} />
                    Exporter en CSV
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-2xl transform transition-all duration-300 ease-in-out animate-modal-open">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h3 className="text-xl font-semibold text-gray-800">Aperçu du Document</h3>
              <button
                onClick={closeDocumentsModal}
                className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center">
              {modalDocumentUrl ? (
                <div className="flex justify-center items-center w-full h-[300px] bg-gray-100 rounded-lg border border-gray-200">
                  <a
                    href={modalDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Voir le Document (ZIP/PDF)
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                  <span>Aucun Document disponible</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

const styles = `
  @keyframes modalOpen {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .animate-modal-open {
    animation: modalOpen 0.3s ease-out forwards;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default VehiculeTable;