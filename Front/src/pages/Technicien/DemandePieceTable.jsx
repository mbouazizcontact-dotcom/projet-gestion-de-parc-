import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FaCheck, FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';
import usePermissions from '../../hooks/usePermissions';

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

export default function ViewAllDemands() {
  const location = useLocation();
  const ViewAll = location.pathname === "/demandes";
  const { permissions, loading, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [demandes, setDemandes] = useState([]);
  const [mecaniciens, setMecaniciens] = useState([]);
  const [mecanicienSearch, setMecanicienSearch] = useState('');
  const [showMecanicienDropdown, setShowMecanicienDropdown] = useState(false);
  const [selectedMecanicien, setSelectedMecanicien] = useState(null);
  const mecanicienInputRef = useRef(null);
  const demandsPerPage = 5;
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0]; // Aujourd'hui : 2025-06-13

  useEffect(() => {
    if (!hasPermission('PiecesDemandees', 'lire')) return;
    fetchDemandes();
    fetchMecaniciens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mecanicienInputRef.current && !mecanicienInputRef.current.contains(event.target)) {
        setShowMecanicienDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchMecaniciens = async () => {
    try {
      const response = await request("get", "/mecaniciens");
      setMecaniciens(response.data);
    } catch (error) {
      toast.error("Erreur lors de la récupération des mécaniciens.");
    }
  };

  const fetchDemandes = async () => {
    try {
      setIsLoading(true);
      const response = await request("get", "/demandes/demandes");
      // Ajouter la date d'aujourd'hui si aucune dateCommande n'est présente
      const updatedDemandes = response.data.map(demande => ({
        ...demande,
        dateCommande: demande.dateCommande || today,
      }));
      setDemandes(updatedDemandes);
    } catch (error) {
      toast.error("Erreur lors de la récupération des demandes.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDemands = demandes.filter((demande) => {
    const demandeurName = demande.demandeur ? 
      `${demande.demandeur.prenom} ${demande.demandeur.nom}`.toLowerCase() : '';
    const immatriculation = demande.immatriculation || '';
    return (
      demandeurName.includes(searchQuery.toLowerCase()) ||
      immatriculation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredMecaniciens = mecaniciens.filter((mecanicien) => {
    const fullName = `${mecanicien.prenom} ${mecanicien.nom}`.toLowerCase();
    return fullName.includes(mecanicienSearch.toLowerCase());
  });

  const handleMecanicienSelect = (mecanicien) => {
    setSelectedMecanicien(mecanicien);
    setMecanicienSearch(`${mecanicien.prenom} ${mecanicien.nom}`);
    setShowMecanicienDropdown(false);
  };

  const totalPages = Math.ceil(filteredDemands.length / demandsPerPage);
  const indexOfLastDemand = currentPage * demandsPerPage;
  const indexOfFirstDemand = indexOfLastDemand - demandsPerPage;
  const currentDemands = filteredDemands.slice(indexOfFirstDemand, indexOfLastDemand);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const approveDemand = async (id, demandeur) => {
    if (!hasPermission('PiecesDemandees', 'modifier')) {
      toast.error("Vous n'avez pas la permission d'approuver une demande.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer l'approbation",
      text: `Voulez-vous vraiment approuver la demande de ${demandeur} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, approuver",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      // Récupérer d'abord les détails de la demande
      const demandeResponse = await request("get", `/demandes/demandes/${id}`);
      const demande = demandeResponse.data;

      // Préparer les données de la pièce avec les informations du véhicule
      const pieceData = {
        reference: demande.reference || `REF-${Date.now()}`,
        nom: demande.pieces,
        marque: demande.marque,
        modele: demande.modele,
        immatriculation: demande.immatriculation,
        dateEntree: today, // Utiliser la date d'aujourd'hui pour la création de la pièce
        etat: 'Neuf',
        categorie: 'Non spécifié'
      };

      // Approuver la demande et créer la pièce
      const response = await request("put", `/demandes/demandes/${id}/approve`, pieceData);
      
      // Mettre à jour l'état localement après approbation
      setDemandes(prevDemandes => 
        prevDemandes.map(demande => 
          demande._id === id 
            ? { ...demande, etat: 'Approuvé' }
            : demande
        )
      );

      await Swal.fire({
        title: "Approbation confirmée",
        text: "La demande a été approuvée et ajoutée au stock avec succès.",
        icon: "success",
      });

      // Déclencher un événement pour rafraîchir les pièces avec les données complètes
      const event = new CustomEvent("refreshPieces", { 
        detail: {
          ...response.data,
          marque: demande.marque,
          modele: demande.modele,
          immatriculation: demande.immatriculation
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue lors de l'approbation.";
      if (errorMessage.includes("duplicate key error")) {
        toast.error("Cette pièce existe déjà dans le stock. Veuillez vérifier la référence.");
      } else {
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const rejectDemand = async (id, demandeur) => {
    if (!hasPermission('PiecesDemandees', 'supprimer')) {
      toast.error("Vous n'avez pas la permission de refuser une demande.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer le refus",
      text: `Voulez-vous vraiment refuser la demande de ${demandeur} ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, refuser",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      await request("put", `/demandes/demandes/${id}/reject`);
      await Swal.fire({
        title: "Refus confirmé",
        text: "La demande a été refusée avec succès.",
        icon: "success",
      });
      // Mettre à jour l'état localement après refus
      setDemandes(prevDemandes => 
        prevDemandes.map(demande => 
          demande._id === id 
            ? { ...demande, etat: 'Refusé' }
            : demande
        )
      );
      fetchDemandes();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Une erreur est survenue lors du refus.";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (!hasPermission('PiecesDemandees', 'lire')) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir la liste des demandes.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen transition-all duration-300">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="flex justify-between items-center pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Liste des demandes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-200">
              Voir les informations sur toutes les demandes
            </p>
          </div>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Rechercher par immatriculation"
              className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
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
                      <th scope="col" className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        DATE
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        DEMANDEUR
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        MARQUE
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        MODÈLE
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        IMMATRICULATION
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        PIÈCES
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                        ÉTAT
                      </th>
                      <th scope="col" className="relative py-3.5 px-4">
                        <span className="font-normal">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                    {currentDemands.length > 0 ? (
                      currentDemands.map((demande) => (
                        <tr key={demande._id}>
                          <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                            <div className="inline-flex items-center gap-x-3">
                              <div className="flex items-center gap-x-2">
                                <div>
                                  <h2 className="font-medium text-gray-800 dark:text-white">
                                    {new Date(demande.dateCommande).toLocaleDateString() || today}
                                  </h2>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                            {demande.demandeur ? `${demande.demandeur.prenom} ${demande.demandeur.nom}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                            {demande.marque || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                            {demande.modele || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                            {demande.immatriculation || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                            {demande.pieces || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                demande.etat === 'Approuvé'
                                  ? 'bg-green-100 text-green-800'
                                  : demande.etat === 'Refusé'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {demande.etat || 'En cours'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm whitespace-nowrap">
                            <div className="flex items-center gap-x-4">
                              {(hasPermission('PiecesDemandees', 'modifier') || hasPermission('PiecesDemandees', 'supprimer')) && demande.etat === 'En cours' && (
                                <>
                                  {hasPermission('PiecesDemandees', 'modifier') && (
                                    <button
                                      onClick={() => approveDemand(demande._id, demande.demandeur || 'cette demande')}
                                      className="text-green-500 hover:text-green-600 focus:outline-none"
                                      title="Approuver la demande"
                                      disabled={isLoading}
                                    >
                                      <FaCheck className="h-5 w-4" />
                                    </button>
                                  )}
                                  {hasPermission('PiecesDemandees', 'supprimer') && (
                                    <button
                                      onClick={() => rejectDemand(demande._id, demande.demandeur || 'cette demande')}
                                      className="text-red-500 hover:text-red-600 focus:outline-none"
                                      title="Refuser la demande"
                                      disabled={isLoading}
                                    >
                                      <FaTimes className="h-5 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-6">
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
                            <p className="text-gray-600 text-lg">Aucune demande trouvée.</p>
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
              disabled={currentPage === 1 || isLoading}
            >
              <span className="mr-2">←</span>PRÉCÉDENTE
            </button>
            <span className="text-sm dark:text-gray-200 text-gray-500">
              Page {currentPage} sur {totalPages || 1}
            </span>
            <button
              className="px-4 py-2 dark:text-gray-200 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0 || isLoading}
            >
              SUIVANTE <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}