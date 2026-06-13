import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';
import usePermissions from '../../../hooks/usePermissions';

const MySwal = withReactContent(Swal);
const API_BASE_URL = 'http://localhost:5000/api';

const request = async (method, url, data = null, headers = {}) => {
  try {
    const config = { method, url: `${API_BASE_URL}${url}`, headers };
    if (data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      config.data = data;
    } else {
      config.data = data;
    }
    return await axios(config);
  } catch (error) {
    throw error;
  }
};

export default function ViewAllProducts() {
  const location = useLocation();
  const ViewAll = location.pathname === "/pieces";
  const { loading, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [vehicleFilterSearch, setVehicleFilterSearch] = useState('');
  const [showVehicleFilterDropdown, setShowVehicleFilterDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [showAddDemandForm, setShowAddDemandForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPart, setSelectedPart] = useState({
    reference: '',
    nom: '',
    categorie: '',
    vehiculeAssigne: null,
    dateEntree: '',
    etat: 'Neuf',
    _id: '',
  });
  const [demandeData, setDemandeData] = useState({
    dateCommande: new Date().toISOString().split('T')[0], // Fixée à aujourd'hui : 2025-06-13
    demandeur: '',
    vehiculeAssigne: null,
    pieces: '',
  });
  const [pieces, setPieces] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const vehicleInputRef = useRef(null);
  const vehicleFilterRef = useRef(null);
  const partsPerPage = ViewAll ? 5 : 5;
  const [isLoading, setIsLoading] = useState(false);

  // Ajout des hooks pour la gestion des mécaniciens
  const [selectedMecanicien, setSelectedMecanicien] = useState(null);
  const [mecanicienSearch, setMecanicienSearch] = useState('');
  const [showMecanicienDropdown, setShowMecanicienDropdown] = useState(false);
  const mecanicienInputRef = useRef(null);
  const [mecaniciens, setMecaniciens] = useState([]);

  const handleMecanicienSelect = (mecanicien) => {
    setSelectedMecanicien(mecanicien);
    setMecanicienSearch(`${mecanicien.prenom} ${mecanicien.nom}`);
    setShowMecanicienDropdown(false);
  };

  useEffect(() => {
    if (!hasPermission('pieces', 'lire')) return;
    fetchPieces();
    fetchVehicles();
    fetchMecaniciens();

    // Écouter l'événement de rafraîchissement des pièces
    const handleRefreshPieces = (event) => {
      if (event.detail && event.detail._id) {
        setPieces(prevPieces => {
          // Éviter les doublons
          const exists = prevPieces.some(piece => piece._id === event.detail._id);
          if (exists) {
            return prevPieces.map(piece =>
              piece._id === event.detail._id ? event.detail : piece
            );
          }
          return [...prevPieces, event.detail];
        });
      } else {
        fetchPieces();
      }
    };
    window.addEventListener('refreshPieces', handleRefreshPieces);

    return () => {
      window.removeEventListener('refreshPieces', handleRefreshPieces);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  useEffect(() => {
    // Filtrer les véhicules selon la recherche
    if (vehicleSearch.trim() === '') {
      setFilteredVehicles(vehicles);
    } else {
      const lowerSearch = vehicleSearch.toLowerCase();
      setFilteredVehicles(
        vehicles.filter(
          (vehicle) =>
            vehicle.marque.toLowerCase().includes(lowerSearch) ||
            vehicle.modele.toLowerCase().includes(lowerSearch) ||
            vehicle.immatriculation.toLowerCase().includes(lowerSearch)
        )
      );
    }
  }, [vehicleSearch, vehicles]);

  // Fermer les dropdowns en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vehicleInputRef.current && !vehicleInputRef.current.contains(event.target)) {
        setShowVehicleDropdown(false);
      }
      if (vehicleFilterRef.current && !vehicleFilterRef.current.contains(event.target)) {
        setShowVehicleFilterDropdown(false);
      }
      if (mecanicienInputRef.current && !mecanicienInputRef.current.contains(event.target)) {
        setShowMecanicienDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchPieces = async () => {
    try {
      setIsLoading(true);
      const response = await request("get", "/pieces/pieces");
      
      // S'assurer que les données du véhicule sont correctement formatées
      const formattedPieces = response.data.map(piece => {
        
        // Si nous avons les informations du véhicule directement
        if (piece.marque && piece.modele && piece.immatriculation) {
          return {
            ...piece,
            vehiculeAssigne: {
              marque: piece.marque,
              modele: piece.modele,
              immatriculation: piece.immatriculation
            }
          };
        }
        // Si nous avons un objet vehiculeAssigne
        else if (piece.vehiculeAssigne) {
          return {
            ...piece,
            vehiculeAssigne: {
              marque: piece.vehiculeAssigne.marque || piece.vehiculeAssigne,
              modele: piece.vehiculeAssigne.modele,
              immatriculation: piece.vehiculeAssigne.immatriculation
            }
          };
        }
        // Si pas de véhicule assigné
        return piece;
      });
      
      setPieces(formattedPieces);
    } catch (error) {
      toast.error("Erreur lors de la récupération des pièces.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await request("get", "/vehicules/all");
      setVehicles(response.data);
      setFilteredVehicles(response.data);
    } catch {
      toast.error("Erreur lors de la récupération des véhicules.");
    }
  };

  const fetchMecaniciens = async () => {
    try {
      const response = await request("get", "/mecaniciens");
      setMecaniciens(response.data);
    } catch {
      // Gère l'erreur si besoin
    }
  };

  const filteredParts = pieces.filter((part) => {
    const matchesSearch =
      part.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVehicle = vehicleFilter ? part.vehiculeAssigne?._id === vehicleFilter : true;
    const matchesDate = dateFilter
      ? new Date(part.dateEntree).toISOString().split('T')[0] === dateFilter
      : true;
    return matchesSearch && matchesVehicle && matchesDate;
  });

  const totalPages = Math.ceil(filteredParts.length / partsPerPage);
  const indexOfLastPart = currentPage * partsPerPage;
  const indexOfFirstPart = indexOfLastPart - partsPerPage;
  const currentParts = filteredParts.slice(indexOfFirstPart, indexOfLastPart);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleAddDemand = () => {
    if (!hasPermission('pieces', 'creer')) {
      toast.error("Vous n'avez pas la permission de créer une demande.");
      return;
    }
    setShowAddDemandForm(true);
    setShowEditForm(false);
    setDemandeData({
      dateCommande: new Date().toISOString().split('T')[0], // Fixée à aujourd'hui
      demandeur: '',
      vehiculeAssigne: null,
      pieces: '',
    });
  };

  const handleEditPart = (part) => {
    if (!hasPermission('pieces', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier une pièce.");
      return;
    }
    setSelectedPart({
      reference: part.reference,
      nom: part.nom,
      categorie: part.categorie,
      vehiculeAssigne: part.vehiculeAssigne?._id || null,
      dateEntree: part.dateEntree ? new Date(part.dateEntree).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      etat: part.etat,
      _id: part._id,
    });
    setVehicleSearch('');
    setShowEditForm(true);
    setShowAddDemandForm(false);
  };

  const handleCancelForm = () => {
    setShowAddDemandForm(false);
    setShowEditForm(false);
    setSelectedPart({
      reference: '',
      nom: '',
      categorie: '',
      vehiculeAssigne: null,
      dateEntree: '',
      etat: 'Neuf',
      _id: '',
    });
    setDemandeData({
      dateCommande: new Date().toISOString().split('T')[0], // Fixée à aujourd'hui
      demandeur: '',
      vehiculeAssigne: null,
      pieces: '',
    });
    setVehicleSearch('');
    setShowVehicleDropdown(false);
  };

  const handleVehicleSelectForDemand = (vehicleId, vehicleLabel) => {
    // Extraire les informations du véhicule
    const vehicleInfo = vehicleLabel.split(' ');
    const marque = vehicleInfo[0];
    const modele = vehicleInfo[1];
    const immatriculation = vehicleInfo[2].replace(/[()]/g, '');

    // Mettre à jour les données de la demande
    setDemandeData({ 
      ...demandeData, 
      vehiculeAssigne: vehicleId,
      marque: marque,
      modele: modele,
      immatriculation: immatriculation
    });

    // Rechercher le mécanicien qui a réceptionné ce véhicule
    const fetchReceptionMecanicien = async () => {
      try {
        const response = await request("get", `/receptions/vehicle/${vehicleId}`);
        if (response.data && response.data.mecanicien) {
          // Définir automatiquement le mécanicien comme demandeur
          setSelectedMecanicien(response.data.mecanicien);
          setMecanicienSearch(`${response.data.mecanicien.prenom} ${response.data.mecanicien.nom}`);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du mécanicien:", error);
      }
    };

    fetchReceptionMecanicien();
    setVehicleSearch(vehicleLabel || '');
    setShowVehicleDropdown(false);
  };

  const validateDemandData = () => {
    if (!selectedMecanicien) {
      toast.error("Le demandeur est requis.");
      return false;
    }
    if (!demandeData.vehiculeAssigne) {
      toast.error("Le véhicule est requis.");
      return false;
    }
    if (!demandeData.pieces.trim()) {
      toast.error("Les pièces sont requises.");
      return false;
    }
    return true;
  };

  const validatePieceData = () => {
    if (!selectedPart.reference?.trim()) {
      toast.error("La référence est requise.");
      return false;
    }
    if (!selectedPart.nom?.trim()) {
      toast.error("Le nom est requis.");
      return false;
    }
    if (!selectedPart.categorie?.trim()) {
      toast.error("La catégorie est requise.");
      return false;
    }
    if (!selectedPart.etat) {
      toast.error("L'état est requis.");
      return false;
    }
    if (!selectedPart.dateEntree) {
      toast.error("La date d'entrée est requise.");
      return false;
    }
    return true;
  };

  const createDemand = async () => {
    if (!validateDemandData()) return;

    if (!hasPermission('pieces', 'creer')) {
      toast.error("Vous n'avez pas la permission de créer une demande.");
      return;
    }

    if (!selectedMecanicien || !selectedMecanicien._id) {
      toast.error("Veuillez sélectionner un mécanicien.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer la nouvelle demande",
      text: `Voulez-vous vraiment créer une demande pour ${demandeData.pieces} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, créer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      
      // Log pour déboguer
      console.log('Mécanicien sélectionné:', selectedMecanicien);
      
      // Restructuration des données envoyées
      const dataToSend = {
        dateCommande: demandeData.dateCommande,
        demandeur: selectedMecanicien._id, // ID du mécanicien
        marque: demandeData.marque,
        modele: demandeData.modele,
        immatriculation: demandeData.immatriculation,
        pieces: demandeData.pieces,
        etat: 'En cours'
      };

      // Log pour déboguer
      console.log('Données envoyées au serveur:', dataToSend);

      const response = await request("post", "/demandes/demandes", dataToSend);
      console.log('Réponse du serveur:', response.data);

      await Swal.fire({
        title: "Demande créée",
        text: "La nouvelle demande a été créée avec succès.",
        icon: "success",
      });

      handleCancelForm();
      const event = new CustomEvent("refreshDemande", { detail: "newDemandeAdded" });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Une erreur est survenue lors de la création de la demande.";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePiece = async () => {
    if (!validatePieceData()) return;

    if (!hasPermission('pieces', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier une pièce.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer la modification",
      text: `Voulez-vous vraiment modifier la pièce ${selectedPart.nom} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, modifier",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      const data = {
        reference: selectedPart.reference,
        nom: selectedPart.nom,
        categorie: selectedPart.categorie,
        vehiculeAssigne: selectedPart.vehiculeAssigne || null,
        dateEntree: selectedPart.dateEntree,
        etat: selectedPart.etat,
      };
      await request("put", `/pieces/pieces/${selectedPart._id}`, data);

      await Swal.fire({
        title: "Modification confirmée",
        text: "La pièce a été modifiée avec succès.",
        icon: "success",
      });

      handleCancelForm();
      fetchPieces();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Une erreur est survenue lors de la modification.";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePiece = async (id, nom) => {
    if (!hasPermission('pieces', 'supprimer')) {
      toast.error("Vous n'avez pas la permission de supprimer une pièce.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer la suppression",
      text: `Voulez-vous vraiment supprimer la pièce ${nom} ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      await request("delete", `/pieces/pieces/${id}`);

      await Swal.fire({
        title: "Suppression confirmée",
        text: "La pièce a été supprimée avec succès.",
        icon: "success",
      });

      fetchPieces();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Une erreur est survenue lors de la suppression.";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleSelect = (vehicleId, vehicleLabel) => {
    setSelectedPart({ ...selectedPart, vehiculeAssigne: vehicleId });
    setVehicleSearch(vehicleLabel || '');
    setShowVehicleDropdown(false);
  };

  const handleVehicleFilterSelect = (vehicleId, vehicleLabel) => {
    setVehicleFilter(vehicleId);
    setVehicleFilterSearch(vehicleLabel || '');
    setShowVehicleFilterDropdown(false);
  };

  const filteredMecaniciens = mecaniciens.filter((mecanicien) => {
    const fullName = `${mecanicien.prenom} ${mecanicien.nom}`.toLowerCase();
    return fullName.includes(mecanicienSearch.toLowerCase());
  });

  const renderAddDemandForm = () => (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Ajouter une demande</h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          createDemand();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={demandeData.dateCommande} // Fixée à 2025-06-13
              readOnly // Empêche la modification
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out bg-gray-100 cursor-not-allowed"
              required
            />
          </div>
          <div className="relative" ref={mecanicienInputRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Demandeur <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center relative">
              <input
                type="text"
                value={mecanicienSearch}
                onChange={e => {
                  setMecanicienSearch(e.target.value);
                  setShowMecanicienDropdown(true);
                }}
                onFocus={() => setShowMecanicienDropdown(true)}
                placeholder="Rechercher un mécanicien..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
                autoComplete="off"
                readOnly={false}
                style={{ cursor: "pointer" }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </span>
            </div>
            {showMecanicienDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredMecaniciens.length > 0 ? (
                  filteredMecaniciens.map((mecanicien) => (
                    <div
                      key={mecanicien._id}
                      onClick={() => handleMecanicienSelect(mecanicien)}
                      className={`px-4 py-2 hover:bg-blue-100 cursor-pointer ${
                        selectedMecanicien && selectedMecanicien._id === mecanicien._id
                          ? 'bg-blue-50 font-semibold'
                          : ''
                      }`}
                    >
                      {mecanicien.prenom} {mecanicien.nom}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-400">Aucun résultat</div>
                )}
              </div>
            )}
          </div>
          <div ref={vehicleInputRef} className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Véhicule <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vehicleSearch}
              onChange={(e) => {
                setVehicleSearch(e.target.value);
                setShowVehicleDropdown(true);
              }}
              onFocus={() => setShowVehicleDropdown(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Rechercher un véhicule..."
            />
            {showVehicleDropdown && (
              <div className="absolute z-10 w-full max-w-md bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle) => (
                    <div
                      key={vehicle._id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() =>
                        handleVehicleSelectForDemand(
                          vehicle._id,
                          `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
                        )
                      }
                    >
                      {vehicle.marque} {vehicle.modele} ({vehicle.immatriculation})
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">Aucun véhicule trouvé</div>
                )}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Pièces <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={demandeData.pieces}
              onChange={(e) => setDemandeData({ ...demandeData, pieces: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez les pièces demandées"
              required
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            type="submit"
            className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : 'Créer Demande'}
          </button>
          <button
            type="button"
            onClick={handleCancelForm}
            className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 w-full"
            disabled={isLoading}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  const renderEditForm = () => (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Modifier une pièce</h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          updatePiece();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Référence <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedPart.reference}
              onChange={(e) => setSelectedPart({ ...selectedPart, reference: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez la référence"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedPart.nom}
              onChange={(e) => setSelectedPart({ ...selectedPart, nom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez le nom de la pièce"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedPart.categorie}
              onChange={(e) => setSelectedPart({ ...selectedPart, categorie: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez la catégorie"
              required
            />
          </div>
          <div ref={vehicleInputRef}>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Véhicule assigné
            </label>
            <input
              type="text"
              value={vehicleSearch}
              onChange={(e) => {
                setVehicleSearch(e.target.value);
                setShowVehicleDropdown(true);
              }}
              onFocus={() => setShowVehicleDropdown(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Rechercher un véhicule..."
            />
            {showVehicleDropdown && (
              <div className="absolute z-10 w-full max-w-md bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                {filteredVehicles.length > 0 ? (
                  <>
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleVehicleSelect(null, 'Aucun véhicule')}
                    >
                      Aucun véhicule
                    </div>
                    {filteredVehicles.map((vehicle) => (
                      <div
                        key={vehicle._id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() =>
                          handleVehicleSelectForDemand(
                            vehicle._id,
                            `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
                          )
                        }
                      >
                        {vehicle.marque} {vehicle.modele} ({vehicle.immatriculation})
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="px-4 py-2 text-gray-500">Aucun véhicule trouvé</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              État <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPart.etat}
              onChange={(e) => setSelectedPart({ ...selectedPart, etat: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              required
            >
              <option value="Neuf">Neuf</option>
              <option value="Occasion">Occasion</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Date d'entrée <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={selectedPart.dateEntree}
              onChange={(e) => setSelectedPart({ ...selectedPart, dateEntree: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              required
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            type="submit"
            className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : 'Modifier'}
          </button>
          <button
            type="button"
            onClick={handleCancelForm}
            className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 w-full"
            disabled={isLoading}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  const renderTableRow = (piece) => {
    // Fonction pour obtenir les informations du véhicule
    const getVehicleInfo = () => {
      
      // Cas 1: Informations directes sur la pièce
      if (piece.marque && piece.modele && piece.immatriculation) {
        return {
          marque: piece.marque,
          modele: piece.modele,
          immatriculation: piece.immatriculation
        };
      }
      // Cas 2: Objet vehiculeAssigne
      else if (piece.vehiculeAssigne && typeof piece.vehiculeAssigne === 'object') {
        const vehicle = piece.vehiculeAssigne;
        if (vehicle.marque && vehicle.modele && vehicle.immatriculation) {
          return {
            marque: vehicle.marque,
            modele: vehicle.modele,
            immatriculation: vehicle.immatriculation
          };
        }
      }
      // Cas 3: Pas de véhicule assigné
      return null;
    };

    const vehicleInfo = getVehicleInfo();

    return (
      <tr key={piece._id}>
        <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
          <div className="inline-flex items-center gap-x-3">
            <div className="flex items-center gap-x-2">
              <div>
                <h2 className="font-medium text-gray-800 dark:text-white">
                  {piece.reference}
                </h2>
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
          {piece.nom}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
          {vehicleInfo ? (
            `${vehicleInfo.marque} ${vehicleInfo.modele} (${vehicleInfo.immatriculation})`
          ) : 'Non assigné'}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
          {piece.demandeur && piece.demandeur.prenom ? `${piece.demandeur.prenom} ${piece.demandeur.nom}` : 'N/A'}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
          {piece.dateEntree
            ? new Date(piece.dateEntree).toLocaleDateString()
            : 'N/A'}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
          {piece.etat}
        </td>
        <td className="px-4 py-4 text-sm whitespace-nowrap">
          <div className="flex items-center gap-x-4">
            {hasPermission('pieces', 'modifier') && (
              <button
                onClick={() => handleEditPart(piece)}
                className="text-yellow-500 hover:text-yellow-600 focus:outline-none"
                title="Modifier la pièce"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            {hasPermission('pieces', 'supprimer') && (
              <button
                onClick={() => deletePiece(piece._id, piece.nom)}
                className="text-red-500 hover:text-red-600 focus:outline-none"
                title="Supprimer la pièce"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (loading) return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (!hasPermission('pieces', 'lire')) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir la liste des pièces.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen transition-all duration-300">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        {showAddDemandForm ? (
          renderAddDemandForm()
        ) : showEditForm ? (
          renderEditForm()
        ) : (
          <>
            <div className="flex justify-between items-center pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  Liste des pièces
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-200">
                  Voir les informations sur toutes les pièces
                </p>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Rechercher par nom ou référence"
                  className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {hasPermission('pieces', 'creer') && (
                  <button
                    onClick={handleAddDemand}
                    className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition duration-300 flex items-center space-x-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>AJOUTER UNE DEMANDE</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 py-6">
              <div className="flex items-center space-x-2" ref={vehicleFilterRef}>
                <label className="text-gray-600 font-medium">Filtrer par véhicule:</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un véhicule..."
                    className="py-2 px-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    value={vehicleFilterSearch}
                    onChange={(e) => {
                      setVehicleFilterSearch(e.target.value);
                      setShowVehicleFilterDropdown(true);
                    }}
                    onFocus={() => setShowVehicleFilterDropdown(true)}
                  />
                  {showVehicleFilterDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleVehicleFilterSelect('', 'Tous les véhicules')}
                      >
                        Tous les véhicules
                      </div>
                      {vehicles
                        .filter(vehicle => 
                          vehicle.marque.toLowerCase().includes(vehicleFilterSearch.toLowerCase()) ||
                          vehicle.modele.toLowerCase().includes(vehicleFilterSearch.toLowerCase()) ||
                          vehicle.immatriculation.toLowerCase().includes(vehicleFilterSearch.toLowerCase())
                        )
                        .map((vehicle) => (
                          <div
                            key={vehicle._id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => 
                              handleVehicleFilterSelect(
                                vehicle._id, 
                                `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
                              )
                            }
                          >
                            {vehicle.marque} {vehicle.modele} ({vehicle.immatriculation})
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-gray-600 font-medium">Filtrer par date:</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="py-2 px-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                            className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            RÉFÉRENCE
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            NOM DE LA PIÈCE
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            VÉHICULE ASSIGNÉ
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            DATE D'ENTRÉE
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            ÉTAT
                          </th>
                          <th scope="col" className="relative py-3.5 px-4">
                            <span className="font-normal">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                        {currentParts.length > 0 ? (
                          currentParts.map(renderTableRow)
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-6">
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <svg
                                  className="h-10 w-10 text-yellow-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                <p className="text-gray-600 text-lg">Aucune pièce trouvée.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-4">
                <button
                  className="px-4 py-2 dark:text-gray-200 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <span className="mr-2">←</span>PRÉCÉDENTE
                </button>
                <span className="text-sm dark:text-gray-200 text-gray-500">
                  Page {currentPage} sur {totalPages || 1}
                </span>
                <button
                  className="px-4 py-2 dark:text-gray-200 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  SUIVANTE <span className="ml-2">→</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}