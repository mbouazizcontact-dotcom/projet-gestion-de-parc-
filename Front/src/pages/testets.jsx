import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faInfoCircle, 
  faSort, 
  faSortUp, 
  faSortDown, 
  faEye 
} from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import usePermissions from '../../hooks/usePermissions';

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
        <span className="text-gray-400 inline-flex items-center">
          <span className="w-8 h-0.5 bg-gray-300 rounded mx-1"></span>
        </span>
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
  const ViewAll = location.pathname === "/Vehicules";
  const { permissions, loading, hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [groupeSearchQuery, setGroupeSearchQuery] = useState("");
  const [driverSearchQuery, setDriverSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedVehicle, setSelectedVehicle] = useState({
    numero: 1,
    marque: "",
    modele: "",
    immatriculation: "",
    mec: "",
    etat: "Fonctionnel",
    proprietaire: "",
    numChassis: "",
    typeMines: "",
    kilometrage: "",
    conducteur: "",
    age: 0,
    carteGrise: null,
    attestationAssurance: null,
    carteGriseUrl: "",
    attestationAssuranceUrl: ""
  });

  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [VEHICULES, setVEHICULES] = useState([]);
  const [CONDUCTEURS, setCONDUCTEURS] = useState([]);
  const [GROUPES, setGROUPES] = useState([]);
  const [nextVehicleNumber, setNextVehicleNumber] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDocuments, setModalDocuments] = useState({ carteGrise: '', attestationAssurance: '' });

  const VehiclesPerPage = ViewAll ? VEHICULES.length : 6;

  // Fonction pour vérifier le kilométrage et les maintenances nécessaires
  const checkKilometrage = (vehicle) => {
    const km = Number(vehicle.kilometrage) || 0;
    const alerts = [];

    // Vérification vidange tous les 10 000 km
    if (km > 0 && km % 10000 === 0) {
      alerts.push({
        type: 'Vidange',
        message: `Vidange préventive nécessaire (${km} km atteints)`,
        kmInterval: 10000,
        nextDue: km + 10000
      });
    }

    // Vérification courroie de distribution tous les 100 000 km
    if (km > 0 && km % 100000 === 0) {
      alerts.push({
        type: 'Courroie distribution',
        message: `Changement de courroie de distribution nécessaire (${km} km atteints)`,
        kmInterval: 100000,
        nextDue: km + 100000
      });
    }

    // Vérification révision complète tous les 20 000 km
    if (km > 0 && km % 20000 === 0) {
      alerts.push({
        type: 'Révision complète',
        message: `Révision complète nécessaire (${km} km atteints)`,
        kmInterval: 20000,
        nextDue: km + 20000
      });
    }

    return alerts;
  };

  // Fonction pour programmer une maintenance
  const handleScheduleMaintenance = (vehicle, alert) => {
    navigate('/ScheduleMaintenance', {
      state: {
        vehicleId: vehicle._id,
        vehicleName: `${vehicle.marque} ${vehicle.modele}`,
        maintenanceType: alert.type,
        currentKm: vehicle.kilometrage,
        nextDueKm: alert.nextDue,
        description: alert.message
      }
    });
  };

  useEffect(() => {
    if (!hasPermission('vehicules', 'lire')) return;
    fetchVehicles();
    fetchConducteurs();
    fetchGroupes();
  }, [hasPermission]);

  useEffect(() => {
    if (VEHICULES.length > 0) {
      const maxNumber = Math.max(...VEHICULES.map(v => v.numero || 0));
      setNextVehicleNumber(maxNumber + 1);
    } else {
      setNextVehicleNumber(1);
    }
  }, [VEHICULES]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/vehicules/all", {
        params: { populate: 'proprietaire conducteur' }
      });
      let vehiclesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const numberedVehicles = vehiclesData.map((vehicle, index) => ({
        ...vehicle,
        numero: vehicle.numero || index + 1
      })).sort((a, b) => a.numero - b.numero);
      setVEHICULES(numberedVehicles);
    } catch (error) {
      toast.error("Échec du chargement des véhicules");
    }
  };

  const fetchConducteurs = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/drivers");
      let driversData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setCONDUCTEURS(driversData);
    } catch (error) {
      toast.error("Échec du chargement des conducteurs");
    }
  };

  const fetchGroupes = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/groupes");
      let groupesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setGROUPES(groupesData);
    } catch (error) {
      toast.error("Échec du chargement des groupes");
    }
  };

  const filteredVehicles = VEHICULES.filter((vehicle) => {
    if (!searchQuery && !groupeSearchQuery && !driverSearchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const matchesMainSearch = !searchQuery ||
      (vehicle.marque || '').toString().toLowerCase().includes(searchLower) ||
      (vehicle.modele || '').toString().toLowerCase().includes(searchLower) ||
      (vehicle.immatriculation || '').toString().toLowerCase().includes(searchLower);

    const matchesGroupeSearch = !groupeSearchQuery ||
      (vehicle.proprietaire?._id === groupeSearchQuery);

    const matchesDriverSearch = !driverSearchQuery ||
      (vehicle.conducteur?._id === driverSearchQuery);

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
  const currentVehicles = ViewAll ? sortedVehicles : sortedVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);

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

  const handleAddVehicle = () => {
    if (!hasPermission('vehicules', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un véhicule.");
      return;
    }
    setSelectedVehicle({
      numero: nextVehicleNumber,
      marque: "",
      modele: "",
      immatriculation: "",
      mec: "",
      etat: "Fonctionnel",
      proprietaire: "",
      numChassis: "",
      typeMines: "",
      kilometrage: "",
      conducteur: "",
      age: 0,
      carteGrise: null,
      attestationAssurance: null,
      carteGriseUrl: "",
      attestationAssuranceUrl: ""
    });
    setShowAddVehicleForm(true);
  };

  const handleEditVehicle = (vehicle) => {
    if (!hasPermission('vehicules', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un véhicule.");
      return;
    }
    setSelectedVehicle({
      id: vehicle._id,
      numero: vehicle.numero || nextVehicleNumber,
      marque: vehicle.marque || "",
      modele: vehicle.modele || "",
      immatriculation: vehicle.immatriculation || "",
      mec: vehicle.mec ? new Date(vehicle.mec).toISOString().split('T')[0] : "",
      etat: vehicle.etat || "Fonctionnel",
      proprietaire: vehicle.proprietaire?._id || "",
      numChassis: vehicle.numChassis || "",
      typeMines: vehicle.typeMines || "",
      kilometrage: vehicle.kilometrage || "",
      conducteur: vehicle.conducteur?._id || "",
      age: vehicle.age || 0,
      carteGrise: null,
      attestationAssurance: null,
      carteGriseUrl: vehicle.carteGriseUrl || "",
      attestationAssuranceUrl: vehicle.attestationAssuranceUrl || ""
    });
    setShowAddVehicleForm(true);
  };

  const handleTableView = () => {
    setShowAddVehicleForm(false);
    setSelectedVehicle({
      numero: 1,
      marque: "",
      modele: "",
      immatriculation: "",
      mec: "",
      etat: "Fonctionnel",
      proprietaire: "",
      numChassis: "",
      typeMines: "",
      kilometrage: "",
      conducteur: "",
      age: 0,
      carteGrise: null,
      attestationAssurance: null,
      carteGriseUrl: "",
      attestationAssuranceUrl: ""
    });
  };

  const validateDocuments = () => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (selectedVehicle.carteGrise) {
      if (!validTypes.includes(selectedVehicle.carteGrise.type)) {
        toast.error("La carte grise doit être une image (PNG, JPEG, JPG) ou un PDF");
        return false;
      }
      if (selectedVehicle.carteGrise.size > maxSize) {
        toast.error("La carte grise ne doit pas dépasser 5 Mo");
        return false;
      }
    }

    if (selectedVehicle.attestationAssurance) {
      if (!validTypes.includes(selectedVehicle.attestationAssurance.type)) {
        toast.error("L'attestation d'assurance doit être une image (PNG, JPEG, JPG) ou un PDF");
        return false;
      }
      if (selectedVehicle.attestationAssurance.size > maxSize) {
        toast.error("L'attestation d'assurance ne doit pas dépasser 5 Mo");
        return false;
      }
    }

    if (!selectedVehicle.id && !selectedVehicle.carteGrise && !selectedVehicle.attestationAssurance) {
      toast.error("Au moins un document (carte grise ou attestation d'assurance) est requis lors de la création");
      return false;
    }

    return true;
  };

  const handleAddVehicleSuccess = async () => {
    if (!hasPermission('vehicules', selectedVehicle.id ? 'modifier' : 'creer')) {
      toast.error(`Vous n'avez pas la permission de ${selectedVehicle.id ? 'modifier' : 'ajouter'} un véhicule.`);
      return;
    }

    const requiredFields = ['marque', 'modele', 'immatriculation', 'mec', 'etat', 'proprietaire'];
    const missingFields = requiredFields.filter(field => !selectedVehicle[field]);
    if (missingFields.length > 0) {
      toast.error(`Champs requis manquants: ${missingFields.join(', ')}`);
      return;
    }

    if (!validateDocuments()) return;

    const isEdit = !!selectedVehicle.id;
    const confirmationMessage = isEdit
      ? "Êtes-vous sûr de vouloir modifier ce véhicule ?"
      : "Êtes-vous sûr de vouloir ajouter ce véhicule ?";

    const result = await MySwal.fire({
      title: `Confirmer ${isEdit ? "la modification" : "l'ajout"}`,
      text: confirmationMessage,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, confirmer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      const token = sessionStorage.getItem("token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : undefined,
      };

      const formData = new FormData();
      formData.append("numero", selectedVehicle.numero);
      formData.append("marque", selectedVehicle.marque);
      formData.append("modele", selectedVehicle.modele);
      formData.append("immatriculation", selectedVehicle.immatriculation);
      formData.append("mec", selectedVehicle.mec ? new Date(selectedVehicle.mec).toISOString() : "");
      formData.append("etat", selectedVehicle.etat);
      formData.append("proprietaire", selectedVehicle.proprietaire || "");
      formData.append("numChassis", selectedVehicle.numChassis || "");
      formData.append("typeMines", selectedVehicle.typeMines || "");
      formData.append("kilometrage", selectedVehicle.kilometrage ? Number(selectedVehicle.kilometrage) : "");
      formData.append("conducteur", selectedVehicle.conducteur || "");

      if (selectedVehicle.carteGrise) {
        formData.append("carteGrise", selectedVehicle.carteGrise);
      }
      if (selectedVehicle.attestationAssurance) {
        formData.append("attestationAssurance", selectedVehicle.attestationAssurance);
      }

      const url = isEdit
        ? `http://localhost:5000/api/vehicules/${selectedVehicle.id}`
        : `http://localhost:5000/api/vehicules`;

      const response = await axios({
        method: isEdit ? 'put' : 'post',
        url: url,
        data: formData,
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });

      Swal.fire({
        title: isEdit ? "Véhicule modifié" : "Véhicule ajouté",
        text: "Opération réussie !",
        icon: "success",
      });

      await fetchVehicles();
      setShowAddVehicleForm(false);
      setSelectedVehicle({
        numero: nextVehicleNumber,
        marque: "",
        modele: "",
        immatriculation: "",
        mec: "",
        etat: "Fonctionnel",
        proprietaire: "",
        numChassis: "",
        typeMines: "",
        kilometrage: "",
        conducteur: "",
        age: 0,
        carteGrise: null,
        attestationAssurance: null,
        carteGriseUrl: "",
        attestationAssuranceUrl: ""
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de l'opération");
    }
  };

  const handleSupprimer = async (vehicleId) => {
    if (!hasPermission('vehicules', 'supprimer')) {
      toast.error("Vous n'avez pas la permission de supprimer un véhicule.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer la suppression",
      text: "Êtes-vous sûr de vouloir supprimer ce véhicule ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      const token = sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`http://localhost:5000/api/vehicules/${vehicleId}`, { headers });

      Swal.fire("Supprimé !", "Le véhicule a été supprimé.", "success");
      fetchVehicles();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openDocumentsModal = ({ carteGrise, attestationAssurance }) => {
    setModalDocuments({ carteGrise: carteGrise || '', attestationAssurance: attestationAssurance || '' });
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDocumentsModal = () => {
    setIsModalOpen(false);
    setModalDocuments({ carteGrise: '', attestationAssurance: '' });
    document.body.style.overflow = 'auto';
  };

  const renderAddVehicleForm = () => (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        {selectedVehicle.id ? "Modifier Véhicule" : "Ajouter Nouveau Véhicule"}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Modèle*</label>
            <input
              type="text"
              value={selectedVehicle.modele}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, modele: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Immatriculation*</label>
            <input
              type="text"
              value={selectedVehicle.immatriculation}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, immatriculation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Date MEC*</label>
            <input
              type="date"
              value={selectedVehicle.mec}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, mec: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">État*</label>
            <select
              value={selectedVehicle.etat}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, etat: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un groupe</option>
              {GROUPES.map((groupe) => (
                <option key={groupe._id} value={groupe._id}>
                  {groupe.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Numéro de châssis</label>
            <input
              type="text"
              value={selectedVehicle.numChassis}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, numChassis: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Type mines</label>
            <input
              type="text"
              value={selectedVehicle.typeMines}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, typeMines: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Kilométrage</label>
            <input
              type="number"
              value={selectedVehicle.kilometrage}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, kilometrage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Conducteur</label>
            <select
              value={selectedVehicle.conducteur}
              onChange={(e) => setSelectedVehicle({ ...selectedVehicle, conducteur: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un conducteur</option>
              {CONDUCTEURS.map((conducteur) => (
                <option key={conducteur._id} value={conducteur._id}>
                  {conducteur.prenom} {conducteur.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Carte Grise {selectedVehicle.id ? "" : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="file"
                id="carteGrise"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                onChange={(e) => setSelectedVehicle({ ...selectedVehicle, carteGrise: e.target.files[0] })}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white text-gray-500 hover:bg-gray-50 transition duration-150 ease-in-out">
                <span>{selectedVehicle.carteGrise ? selectedVehicle.carteGrise.name : "Choisir un fichier"}</span>
                <span className="text-blue-600 font-semibold">Parcourir</span>
              </div>
            </div>
            {selectedVehicle.id && selectedVehicle.carteGriseUrl && !selectedVehicle.carteGrise && (
              <div className="mt-2">
                {selectedVehicle.carteGriseUrl.endsWith('.pdf') ? (
                  <a href={selectedVehicle.carteGriseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Voir la Carte Grise (PDF)
                  </a>
                ) : (
                  <img
                    src={selectedVehicle.carteGriseUrl}
                    alt="Carte Grise"
                    className="w-32 h-20 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-red-500 text-sm">Erreur de chargement de l\'image</span>';
                    }}
                  />
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Attestation d'Assurance {selectedVehicle.id ? "" : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="file"
                id="attestationAssurance"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                onChange={(e) => setSelectedVehicle({ ...selectedVehicle, attestationAssurance: e.target.files[0] })}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white text-gray-500 hover:bg-gray-50 transition duration-150 ease-in-out">
                <span>{selectedVehicle.attestationAssurance ? selectedVehicle.attestationAssurance.name : "Choisir un fichier"}</span>
                <span className="text-blue-600 font-semibold">Parcourir</span>
              </div>
            </div>
            {selectedVehicle.id && selectedVehicle.attestationAssuranceUrl && !selectedVehicle.attestationAssurance && (
              <div className="mt-2">
                {selectedVehicle.attestationAssuranceUrl.endsWith('.pdf') ? (
                  <a href={selectedVehicle.attestationAssuranceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Voir l'Attestation d'Assurance (PDF)
                  </a>
                ) : (
                  <img
                    src={selectedVehicle.attestationAssuranceUrl}
                    alt="Attestation d'Assurance"
                    className="w-32 h-20 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-red-500 text-sm">Erreur de chargement de l\'image</span>';
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full"
          >
            {selectedVehicle.id ? "Modifier Véhicule" : "Ajouter Véhicule"}
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
                    {ViewAll ? "Affichage de tous les véhicules" : "Affichage partiel des véhicules"}
                  </p>
                </div>
                <div className="ml-auto justify-between flex items-center space-x-3">
                  <div className='flex gap-4'>
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
                      {GROUPES.map((groupe) => (
                        <option key={groupe._id} value={groupe._id}>
                          {groupe.nom || 'Groupe sans nom'}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={driverSearchQuery}
                      onChange={(e) => setDriverSearchQuery(e.target.value)}
                    >
                      <option value="">Tous les conducteurs</option>
                      {CONDUCTEURS.map((conducteur) => (
                        <option key={conducteur._id} value={conducteur._id}>
                          {conducteur.prenom} {conducteur.nom}
                        </option>
                      ))}
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
                            <th scope="col" className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('numero')}>
                              N° <FontAwesomeIcon icon={sortColumn === 'numero' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('marque')}>
                              Marque <FontAwesomeIcon icon={sortColumn === 'marque' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('modele')}>
                              Modèle <FontAwesomeIcon icon={sortColumn === 'modele' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-2 py-2 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('immatriculation')}>
                              Immatriculation <FontAwesomeIcon icon={sortColumn === 'immatriculation' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('mec')}>
                              MEC <FontAwesomeIcon icon={sortColumn === 'mec' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-4 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('age')}>
                              Âge <FontAwesomeIcon icon={sortColumn === 'age' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-12 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('etat')}>
                              État <FontAwesomeIcon icon={sortColumn === 'etat' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('proprietaire')}>
                              Groupe <FontAwesomeIcon icon={sortColumn === 'proprietaire' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('numChassis')}>
                              NUM_CHASSIS <FontAwesomeIcon icon={sortColumn === 'numChassis' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('typeMines')}>
                              TYPE_MINES <FontAwesomeIcon icon={sortColumn === 'typeMines' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('kilometrage')}>
                              Kilométrage <FontAwesomeIcon icon={sortColumn === 'kilometrage' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort('conducteur')}>
                              Conducteur <FontAwesomeIcon icon={sortColumn === 'conducteur' ? (sortDirection === 'asc' ? faSortUp : faSortDown) : faSort} />
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              Alertes
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              Documents
                            </th>
                            <th scope="col" className="relative py-3.5 px-4"><span className="font-normal">Actions</span></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                          {currentVehicles.length > 0 ? (
                            currentVehicles.map((vehicle, index) => (
                              <tr key={index}>
                                <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">{vehicle.numero}</td>
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
                                  <div className={`inline-flex items-center px-3 py-1 rounded-full gap-x-2 
                                    ${vehicle.etat === "Fonctionnel" ? 'bg-emerald-100/60 text-emerald-500' :
                                      vehicle.etat === "Reparation" ? 'bg-yellow-100/60 text-yellow-500' :
                                        vehicle.etat === "Accidenté" ? 'bg-red-100/60 text-red-500' :
                                          vehicle.etat === "stock" ? 'bg-blue-100/60 text-blue-500' :
                                            'bg-gray-100/60 text-gray-500'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full 
                                      ${vehicle.etat === "Fonctionnel" ? 'bg-emerald-500' :
                                        vehicle.etat === "Reparation" ? 'bg-yellow-500' :
                                          vehicle.etat === "Accidenté" ? 'bg-red-500' :
                                            vehicle.etat === "stock" ? 'bg-blue-500' :
                                              'bg-gray-500'}`}>
                                    </span>
                                    <h2 className="text-sm font-normal">{vehicle.etat || "Indéfini"}</h2>
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
                                    <div className="flex items-center">
                                      <span>{vehicle.kilometrage} km</span>
                                      {checkKilometrage(vehicle).length > 0 && (
                                        <button 
                                          onClick={() => {
                                            const alerts = checkKilometrage(vehicle);
                                            if (alerts.length > 0) {
                                              Swal.fire({
                                                title: 'Maintenance requise',
                                                html: alerts.map(alert => 
                                                  `<div class="text-left mb-2">
                                                    <p class="font-semibold">${alert.type}</p>
                                                    <p class="text-sm">${alert.message}</p>
                                                  </div>`
                                                ).join(''),
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Programmer maintenance',
                                                cancelButtonText: 'Fermer'
                                              }).then((result) => {
                                                if (result.isConfirmed) {
                                                  handleScheduleMaintenance(vehicle, alerts[0]);
                                                }
                                              });
                                            }
                                          }}
                                          className="ml-2 text-yellow-500 hover:text-yellow-700"
                                          title="Maintenance requise"
                                        >
                                          <FontAwesomeIcon icon={faExclamationTriangle} />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    renderTableCell(null, 'text', 'Kilométrage')
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  {vehicle.conducteur?.prenom && vehicle.conducteur?.nom ?
                                    `${vehicle.conducteur.prenom} ${vehicle.conducteur.nom}` :
                                    renderTableCell(null, 'text', 'Conducteur')}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                  {checkKilometrage(vehicle).length > 0 ? (
                                    <button 
                                      onClick={() => {
                                        const alerts = checkKilometrage(vehicle);
                                        Swal.fire({
                                          title: 'Maintenance requise',
                                          html: alerts.map(alert => 
                                            `<div class="text-left mb-2">
                                              <p class="font-semibold">${alert.type}</p>
                                              <p class="text-sm">${alert.message}</p>
                                            </div>`
                                          ).join(''),
                                          icon: 'warning',
                                          showCancelButton: true,
                                          confirmButtonText: 'Programmer maintenance',
                                          cancelButtonText: 'Fermer'
                                        }).then((result) => {
                                          if (result.isConfirmed) {
                                            handleScheduleMaintenance(vehicle, alerts[0]);
                                          }
                                        });
                                      }}
                                      className="text-yellow-500 hover:text-yellow-700"
                                      title="Maintenance requise"
                                    >
                                      <FontAwesomeIcon icon={faExclamationTriangle} />
                                    </button>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                  {(vehicle.carteGriseUrl || vehicle.attestationAssuranceUrl) ? (
                                    <button
                                      onClick={() => openDocumentsModal({ carteGrise: vehicle.carteGriseUrl, attestationAssurance: vehicle.attestationAssuranceUrl })}
                                      className="text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Voir les documents (carte grise et attestation d'assurance)"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                                    </button>
                                  ) : (
                                    renderTableCell(null, 'text', 'Documents')
                                  )}
                                </td>
                                <td className="px-4 py-4 text-sm whitespace-nowrap">
                                  <div className="flex items-center gap-x-6">
                                    {hasPermission('vehicules', 'supprimer') && (
                                      <button
                                        onClick={() => handleSupprimer(vehicle._id || vehicle.id)}
                                        className="text-gray-500 transition-colors duration-200 dark:hover:text-red-500 dark:text-gray-300 hover:text-red-500 focus:outline-none"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                      </button>
                                    )}
                                    {hasPermission('vehicules', 'modifier') && (
                                      <button
                                        onClick={() => handleEditVehicle(vehicle)}
                                        className="text-gray-500 transition-colors duration-200 dark:hover:text-yellow-500 dark:text-gray-300 hover:text-yellow-500 focus:outline-none"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="15" className="text-center py-6">
                                <div className="relative">
                                  <div className="flex flex-col items-center justify-center space-y-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl" />
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

              {!ViewAll && (
                <div className="flex justify-between items-center py-4">
                  <button
                    className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <span className="mr-2">←</span>PRÉCÉDENTE
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} sur {totalPages || 1}
                  </span>
                  <button
                    className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    SUIVANTE <span className="ml-2">→</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-2xl transform transition-all duration-300 ease-in-out opacity-0 scale-95 animate-modal-open">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h3 className="text-xl font-semibold text-gray-800">Aperçu des documents</h3>
              <button 
                onClick={closeDocumentsModal} 
                className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modalDocuments.carteGrise ? (
                <div className="flex flex-col items-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Carte Grise</h4>
                  <div className="flex justify-center items-center w-full h-[300px] bg-gray-100 rounded-lg border border-gray-200">
                    {modalDocuments.carteGrise.endsWith('.pdf') ? (
                      <a
                        href={modalDocuments.carteGrise}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Voir le PDF (Carte Grise)
                      </a>
                    ) : (
                      <img
                        src={modalDocuments.carteGrise}
                        alt="Carte Grise"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span class="text-red-500">Erreur de chargement de l\'image</span>';
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                  <span>Aucune carte grise disponible</span>
                </div>
              )}

              {modalDocuments.attestationAssurance ? (
                <div className="flex flex-col items-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Attestation d'Assurance</h4>
                  <div className="flex justify-center items-center w-full h-[300px] bg-gray-100 rounded-lg border border-gray-200">
                    {modalDocuments.attestationAssurance.endsWith('.pdf') ? (
                      <a
                        href={modalDocuments.attestationAssurance}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Voir le PDF (Attestation d'Assurance)
                      </a>
                    ) : (
                      <img
                        src={modalDocuments.attestationAssurance}
                        alt="Attestation d'Assurance"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span class="text-red-500">Erreur de chargement de l\'image</span>';
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                  <span>Aucune attestation d'assurance disponible</span>
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