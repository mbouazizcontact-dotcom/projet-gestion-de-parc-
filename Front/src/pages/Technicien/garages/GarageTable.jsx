import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
    const config = { method, url, headers, data };
    return await axios(config);
  } catch (error) {
    console.error("API Request Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config
    });
    throw error;
  }
};

export default function GarageTable() {
  const location = useLocation();
  const ViewAll = location.pathname === "/Garages";
  const { permissions, loading, error, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGarage, setSelectedGarage] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: ''
  });
  const [showAddGarageForm, setShowAddGarageForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const garagesPerPage = ViewAll ? 5 : 10;
  const [garages, setGarages] = useState([]);

  useEffect(() => {
    if (!hasPermission('garages', 'lire') || !hasPermission('atelier', 'lire')) {
      return;
    }
    fetchGarages();
  }, [hasPermission]);

  const fetchGarages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/garages`);
      setGarages(response.data);
    } catch (error) {
      console.error("Full error response:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config
      });
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error?.message 
        || error.message 
        || 'Impossible de récupérer les garages';
        
      toast.error(`Erreur: ${errorMessage}`);
      
      // For debugging - remove in production
      if (error.response?.data?.error?.stack) {
        console.error("Server error stack:", error.response.data.error.stack);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reste du code inchangé (filteredGarages, handleNextPage, etc.)
  // Pour brièveté, je ne répète pas les parties non modifiées

  const filteredGarages = garages.filter((garage) =>
    garage.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garage.adresse?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGarages.length / garagesPerPage);
  const indexOfLastGarage = currentPage * garagesPerPage;
  const indexOfFirstGarage = indexOfLastGarage - garagesPerPage;
  const currentGarages = filteredGarages.slice(indexOfFirstGarage, indexOfLastGarage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleAddGarage = () => {
    if (!hasPermission('garages', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un garage.");
      return;
    }
    setShowAddGarageForm(true);
    setSelectedGarage({
      nom: '',
      adresse: '',
      telephone: '',
      email: ''
    });
  };

  const handleEditGarage = (garage) => {
    if (!hasPermission('garages', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un garage.");
      return;
    }
    setSelectedGarage({ ...garage });
    setShowAddGarageForm(true);
  };

  const handleCancelGarageForm = () => {
    setShowAddGarageForm(false);
    setSelectedGarage({
      nom: '',
      adresse: '',
      telephone: '',
      email: ''
    });
  };

  const validateGarageData = () => {
    if (!selectedGarage.nom?.trim()) {
      toast.error("Le nom du garage est requis");
      return false;
    }
    if (!selectedGarage.adresse?.trim()) {
      toast.error("L'adresse est requise");
      return false;
    }
    if (selectedGarage.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedGarage.email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return false;
    }
    if (selectedGarage.telephone && !/^\+?[0-9\s\-\(\)]{8,15}$/.test(selectedGarage.telephone)) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return false;
    }
    return true;
  };

  const handleAddGarageSuccess = async () => {
    if (!validateGarageData()) return;

    const isEdit = Boolean(selectedGarage._id);
    if (isEdit && !hasPermission('garages', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un garage.");
      return;
    }
    if (!isEdit && !hasPermission('garages', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un garage.");
      return;
    }

    const confirmationMessage = isEdit
      ? "Êtes-vous sûr de vouloir modifier ce garage ?"
      : "Êtes-vous sûr de vouloir ajouter ce garage ?";
    const actionTitle = isEdit ? "Modifier Garage" : "Ajouter Garage";

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
      setIsLoading(true);
      const garageData = {
        nom: selectedGarage.nom.trim(),
        adresse: selectedGarage.adresse.trim(),
        telephone: selectedGarage.telephone?.trim() || '',
        email: selectedGarage.email?.trim() || ''
      };

      let response;
      if (isEdit) {
        response = await request("put", `${API_BASE_URL}/garages/${selectedGarage._id}`, garageData);
      } else {
        response = await request("post", `${API_BASE_URL}/garages`, garageData);
      }

      await Swal.fire({
        title: `${actionTitle} réussie`,
        text: `Garage ${isEdit ? "modifié" : "ajouté"} avec succès!`,
        icon: "success",
      });

      setShowAddGarageForm(false);
      setSelectedGarage({
        nom: '',
        adresse: '',
        telephone: '',
        email: ''
      });
      fetchGarages();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue";
      toast.error(`Erreur: ${errorMessage}`);
      console.error("Detailed Error:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupprimer = async (garageId) => {
    if (!hasPermission('garages', 'supprimer')) {
      toast.error("Vous n'avez pas la permission de supprimer un garage.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer la suppression",
      text: "Êtes-vous sûr de vouloir supprimer ce garage ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      await request("delete", `${API_BASE_URL}/garages/${garageId}`);
      await Swal.fire({
        title: "Suppression réussie",
        text: "Garage supprimé avec succès!",
        icon: "success",
      });
      fetchGarages();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue";
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAddGarageForm = () => (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        {selectedGarage._id ? "Modifier Garage" : "Ajouter Nouveau Garage"}
      </h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddGarageSuccess();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedGarage({ ...selectedGarage, nom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer nom du garage"
              value={selectedGarage.nom || ""}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Adresse <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedGarage({ ...selectedGarage, adresse: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer adresse"
              value={selectedGarage.adresse || ""}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Téléphone
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedGarage({ ...selectedGarage, telephone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer téléphone"
              value={selectedGarage.telephone || ""}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              onChange={(e) => setSelectedGarage({ ...selectedGarage, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer email"
              value={selectedGarage.email || ""}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            type="submit"
            className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : (selectedGarage._id ? "Modifier Garage" : "Ajouter Garage")}
          </button>
          <button
            onClick={handleCancelGarageForm}
            type="button"
            className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 w-full"
            disabled={isLoading}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (!hasPermission('garages', 'lire') || !hasPermission('atelier', 'lire')) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir la liste des garages.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen transition-all duration-300">
      <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        {showAddGarageForm ? (
          renderAddGarageForm()
        ) : (
          <>
            <div className="flex justify-between items-center pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Liste des garages</h2>
                <p className="text-sm text-gray-500 dark:text-gray-200">Voir les informations sur tous les garages</p>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Rechercher"
                  className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {hasPermission('garages', 'creer') && (
                  <button onClick={handleAddGarage} className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition duration-300">
                    AJOUTER UN GARAGE
                  </button>
                )}
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
                            NOM
                          </th>
                          <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                            ADRESSE
                          </th>
                          <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                            TÉLÉPHONE
                          </th>
                          <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                            EMAIL
                          </th>
                          <th scope="col" className="relative py-3.5 px-4">
                            <span className="font-normal">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                        {currentGarages.length > 0 ? (
                          currentGarages.map((garage, index) => (
                            <tr key={index}>
                              <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                <div className="inline-flex items-center gap-x-3">
                                  <div className="flex items-center gap-x-2">
                                    <div>
                                      <h2 className="font-medium text-gray-800 dark:text-white">{garage.nom}</h2>
                                      <p className="text-sm font-normal text-gray-600 dark:text-gray-400">#garage{garage._id.substring(0, 5)}</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">{garage.adresse}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">{garage.telephone || '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">{garage.email || '-'}</td>
                              <td className="px-4 py-4 text-sm whitespace-nowrap">
                                <div className="flex items-center gap-x-6">
                                  {hasPermission('garages', 'supprimer') && (
                                    <button onClick={() => handleSupprimer(garage._id)} className="text-gray-500 transition-colors duration-200 dark:hover:text-red-500 dark:text-gray-300 hover:text-red-500 focus:outline-none">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  )}
                                  {hasPermission('garages', 'modifier') && (
                                    <button onClick={() => handleEditGarage(garage)} className="text-gray-500 transition-colors duration-200 dark:hover:text-yellow-500 dark:text-gray-300 hover:text-yellow-500 focus:outline-none">
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
                            <td colSpan="5" className="text-center py-6">
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl" />
                                <p className="text-gray-600 text-lg">Aucun garage trouvé.</p>
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
                className="px-4 dark:text-gray-200 py-2 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                SUIVANTE <span className="ml-2">→</span>
              </button>
            </div>
          </>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}