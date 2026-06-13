import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { faExclamationTriangle, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';
import usePermissions from '../../../hooks/usePermissions';

const MySwal = withReactContent(Swal);
const API_BASE_URL = 'http://localhost:5000/api';

export default function GroupeTable() {
  const location = useLocation();
  const ViewAll = location.pathname === "/GroupeListe";
  const { permissions, loading, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGroupe, setSelectedGroupe] = useState({
    nom: '',
    nombreConducteurs: 0,
    nombreVehiculesFonctionnels: 0,
    nombreVehiculesAccidentes: 0,
    nombreVehiculesStock: 0,
    nombreVehiculesReparation: 0,
    nombreTotalVehicules: 0
  });
  const [showAddGroupeForm, setShowAddGroupeForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const groupesPerPage = ViewAll ? 5 : 10;
  const [groupes, setGroupes] = useState([]);

  useEffect(() => {
    if (!hasPermission('groupes', 'lire')) return;
    fetchGroupes();
  }, [hasPermission]);

  const fetchGroupes = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/groupes`);
      setGroupes(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des groupes:", error.response?.data || error);
      toast.error("Erreur lors de la récupération des groupes.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGroupes = groupes.filter((groupe) =>
    groupe.nom?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGroupes.length / groupesPerPage);
  const indexOfLastGroupe = currentPage * groupesPerPage;
  const indexOfFirstGroupe = indexOfLastGroupe - groupesPerPage;
  const currentGroupes = filteredGroupes.slice(indexOfFirstGroupe, indexOfLastGroupe);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleAddGroupe = () => {
    if (!hasPermission('groupes', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un groupe.");
      return;
    }
    setShowAddGroupeForm(true);
    setSelectedGroupe({
      nom: '',
      nombreConducteurs: 0,
      nombreVehiculesFonctionnels: 0,
      nombreVehiculesAccidentes: 0,
      nombreVehiculesStock: 0,
      nombreVehiculesReparation: 0,
      nombreTotalVehicules: 0
    });
  };

  const handleEditGroupe = (groupe) => {
    if (!hasPermission('groupes', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un groupe.");
      return;
    }
    setSelectedGroupe({
      ...groupe,
      nom: groupe.nom,
      nombreConducteurs: 0,
      nombreVehiculesFonctionnels: 0,
      nombreVehiculesAccidentes: 0,
      nombreVehiculesStock: 0,
      nombreVehiculesReparation: 0,
      nombreTotalVehicules: 0
    });
    setShowAddGroupeForm(true);
  };

  const handleTableGroupe = () => {
    setShowAddGroupeForm(false);
    setSelectedGroupe({
      nom: '',
      nombreConducteurs: 0,
      nombreVehiculesFonctionnels: 0,
      nombreVehiculesAccidentes: 0,
      nombreVehiculesStock: 0,
      nombreVehiculesReparation: 0,
      nombreTotalVehicules: 0
    });
  };

  const validateGroupeData = () => {
    if (!selectedGroupe.nom?.trim()) {
      toast.error("Le nom du groupe est requis");
      return false;
    }
    return true;
  };

  const handleAddGroupeSuccess = async () => {
    if (!validateGroupeData()) return;

    const isEdit = Boolean(selectedGroupe._id);
    if (isEdit && !hasPermission('groupes', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un groupe.");
      return;
    }
    if (!isEdit && !hasPermission('groupes', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un groupe.");
      return;
    }

    const confirmationMessage = isEdit
      ? "Êtes-vous sûr de vouloir modifier ce groupe ?"
      : "Êtes-vous sûr de vouloir ajouter ce groupe ?";
    const actionTitle = isEdit ? "Modifier Groupe" : "Ajouter Groupe";

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
      const groupeData = {
        nom: selectedGroupe.nom.trim(),
        nombreConducteurs: 0,
        nombreVehiculesFonctionnels: 0,
        nombreVehiculesAccidentes: 0,
        nombreVehiculesStock: 0,
        nombreVehiculesReparation: 0,
        nombreTotalVehicules: 0
      };

      let response;
      if (isEdit) {
        response = await axios.put(`${API_BASE_URL}/groupes/${selectedGroupe._id}`, groupeData);
      } else {
        response = await axios.post(`${API_BASE_URL}/groupes`, groupeData);
      }

      await Swal.fire({
        title: `${actionTitle} réussie`,
        text: `Groupe ${isEdit ? "modifié" : "ajouté"} avec succès!`,
        icon: "success",
      });

      setShowAddGroupeForm(false);
      setSelectedGroupe({
        nom: '',
        nombreConducteurs: 0,
        nombreVehiculesFonctionnels: 0,
        nombreVehiculesAccidentes: 0,
        nombreVehiculesStock: 0,
        nombreVehiculesReparation: 0,
        nombreTotalVehicules: 0
      });
      fetchGroupes();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Une erreur est survenue";
      toast.error(`Erreur: ${errorMessage}`);
      console.error("Erreur détaillée:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupprimer = async (groupeId) => {
    if (!hasPermission('groupes', 'supprimer')) {
      toast.error("Vous n'avez pas la permission de supprimer un groupe.");
      return;
    }

    try {
      const result = await MySwal.fire({
        title: "Confirmer la suppression",
        text: "Êtes-vous sûr de vouloir supprimer ce groupe ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Oui, supprimer",
        cancelButtonText: "Annuler",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
      });

      if (!result.isConfirmed) return;

      setIsLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/groupes/${groupeId}`);

      if (response.data.success) {
        await Swal.fire({
          title: "Suppression réussie",
          text: "Groupe supprimé avec succès!",
          icon: "success",
          confirmButtonColor: "#4f46e5",
        });
        fetchGroupes();
      } else {
        toast.error(response.data.message || "Échec de la suppression");
      }
    } catch (error) {
      console.error("Erreur détaillée:", error.response?.data);
      const errorMessage = error.response?.data?.message || "Une erreur est survenue lors de la suppression";
      toast.error(`Erreur: ${errorMessage}`);

      if (process.env.NODE_ENV === 'development') {
        console.error("Détails de l'erreur:", error.response?.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderAddGroupeForm = () => (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        {selectedGroupe._id ? "Modifier Groupe" : "Ajouter Nouveau Groupe"}
      </h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddGroupeSuccess();
        }}
      >
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            onChange={(e) => setSelectedGroupe({ ...selectedGroupe, nom: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Entrer nom du groupe"
            value={selectedGroupe.nom || ""}
            required
          />
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            type="submit"
            className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : (selectedGroupe._id ? "Modifier Groupe" : "Ajouter Groupe")}
          </button>
          <button
            onClick={handleTableGroupe}
            type="button"
            className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full"
            disabled={isLoading}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (!hasPermission('groupes', 'lire')) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir la liste des groupes.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen transition-all duration-300">
      <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        {showAddGroupeForm ? (
          renderAddGroupeForm()
        ) : (
          <>
            <div className="flex justify-between items-center pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Liste des groupes</h2>
                <p className="text-sm text-gray-500 dark:text-gray-200">Voir les informations sur tous les groupes</p>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Rechercher"
                  className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {hasPermission('groupes', 'creer') && (
                  <button
                    onClick={handleAddGroupe}
                    className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition duration-300 flex items-center space-x-2"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>AJOUTER UN GROUPE</span>
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
                            Nom du Groupe
                          </th>
                          <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                            Nombre de Conducteurs
                          </th>
                          <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                            Véhicules Fonctionnels
                          </th>
                          <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                            Véhicules Accidentés
                          </th>
                          <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                            Véhicules en Stock
                          </th>
                          <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                            Véhicules en Réparation
                          </th>
                          <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                            Nombre Total de Véhicules
                          </th>
                          <th scope="col" className="relative py-3.5 px-4">
                            <span className="font-normal">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                        {currentGroupes.length > 0 ? (
                          currentGroupes.map((groupe, index) => (
                            <tr key={index}>
                              <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                <div className="inline-flex items-center gap-x-3">
                                  <div className="flex items-center gap-x-2">
                                    <div>
                                      <h2 className="font-bold text-gray-800 dark:text-white">{groupe.nom}</h2>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {groupe.nombreConducteurs}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {groupe.nombreVehiculesFonctionnels}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {groupe.nombreVehiculesAccidentes}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {groupe.nombreVehiculesStock}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {groupe.nombreVehiculesReparation}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {groupe.nombreTotalVehicules}
                              </td>
                              <td className="px-4 py-4 text-sm whitespace-nowrap">
                                <div className="flex items-center gap-x-6">
                                  {hasPermission('groupes', 'supprimer') && (
                                    <button onClick={() => handleSupprimer(groupe._id)} className="text-gray-500 transition-colors duration-200 dark:hover:text-red-500 dark:text-gray-300 hover:text-red-500 focus:outline-none">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  )}
                                  {hasPermission('groupes', 'modifier') && (
                                    <button onClick={() => handleEditGroupe(groupe)} className="text-gray-500 transition-colors duration-200 dark:hover:text-yellow-500 dark:text-gray-300 hover:text-yellow-500 focus:outline-none">
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
                            <td colSpan="8" className="text-center py-6">
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl" />
                                <p className="text-gray-600 text-lg">Aucun groupe trouvé.</p>
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