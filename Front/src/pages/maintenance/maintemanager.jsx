
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { WrenchScrewdriverIcon, PlusIcon } from '@heroicons/react/24/solid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from '../../Components/axios/axiosConfig';
import usePermissions from '../../hooks/usePermissions';

const MySwal = withReactContent(Swal);
const API_BASE_URL = 'http://localhost:5000/api/maintenance';

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
    console.error("API Request Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config,
    });
    throw error;
  }
};

const getCriticiteStyles = (criticite) => {
  switch (criticite.toLowerCase()) {
    case 'faible':
      return 'bg-blue-200 text-blue-800';
    case 'moyenne':
      return 'bg-green-200 text-black-100';
    case 'haute':
      return 'bg-red-200  text-black-100';
    case 'critique':
      return 'bg-red-400 text-black-100';
    default:
      return 'bg-red-100 text-gray-800';
  }
};

export default function MaintenanceManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const ViewAll = location.pathname == "/maintenance-types";
  const { permissions, loading, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState({
    nom: '',
    description: '',
    fréquence_recommandée: '',
    type_intervention: '',
    criticite: 'moyenne',
    _id: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInterventionType, setSelectedInterventionType] = useState("");
  const [interventionTypes, setInterventionTypes] = useState([]);
  const partsPerPage = ViewAll ? 5 : 5;

  useEffect(() => {
    if (!hasPermission('TypesMaintenances', 'lire')) return;
    fetchMaintenanceTypes();
  }, [hasPermission]);

  useEffect(() => {
    const uniqueTypes = [...new Set(maintenanceTypes.map(type => type.type_intervention))].filter(Boolean);
    setInterventionTypes(uniqueTypes);
  }, [maintenanceTypes]);

  const fetchMaintenanceTypes = async () => {
    try {
      setIsLoading(true);
      const response = await request("get", "/types");
      setMaintenanceTypes(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error("Erreur lors de la récupération des types de maintenance.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaintenanceTypes = maintenanceTypes.filter((type) =>
    type.nom.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedInterventionType || type.type_intervention === selectedInterventionType)
  );

  const totalPages = Math.ceil(filteredMaintenanceTypes.length / partsPerPage);
  const indexOfLastType = currentPage * partsPerPage;
  const indexOfFirstType = indexOfLastType - partsPerPage;
  const currentTypes = filteredMaintenanceTypes.slice(indexOfFirstType, indexOfLastType);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleAddType = () => {
    if (!hasPermission('TypesMaintenances', 'creer')) {
      toast.error("Vous n'avez pas la permission de créer un type de maintenance.");
      return;
    }
    setShowAddForm(true);
    setShowEditForm(false);
    setSelectedMaintenanceType({
      nom: '',
      description: '',
      fréquence_recommandée: '',
      type_intervention: '',
      criticite: 'moyenne',
      _id: '',
    });
  };

  const handleEditType = (type) => {
    if (!hasPermission('TypesMaintenances', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un type de maintenance.");
      return;
    }
    setSelectedMaintenanceType({
      nom: type.nom,
      description: type.description || '',
      fréquence_recommandée: type.fréquence_recommandée,
      type_intervention: type.type_intervention,
      criticite: type.criticite || 'moyenne',
      _id: type._id,
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedMaintenanceType({
      nom: '',
      description: '',
      fréquence_recommandée: '',
      type_intervention: '',
      criticite: 'moyenne',
      _id: '',
    });
  };

  const validateTypeData = () => {
    if (!selectedMaintenanceType.nom.trim()) {
      toast.error("Le nom est requis.");
      return false;
    }
    if (!selectedMaintenanceType.fréquence_recommandée.trim()) {
      toast.error("La fréquence recommandée est requise.");
      return false;
    }
    if (!selectedMaintenanceType.type_intervention.trim()) {
      toast.error("Le type d'intervention est requis.");
      return false;
    }
    if (!['faible', 'moyenne', 'haute', 'critique'].includes(selectedMaintenanceType.criticite)) {
      toast.error("La criticité doit être faible, moyenne, haute ou critique.");
      return false;
    }
    return true;
  };

  const createType = async () => {
    if (!validateTypeData()) return;

    if (!hasPermission('TypesMaintenances', 'creer')) {
      toast.error("Vous n'avez pas la permission de créer un type de maintenance.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer la création",
      text: `Voulez-vous vraiment créer le type de maintenance ${selectedMaintenanceType.nom} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, créer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      const data = {
        nom: selectedMaintenanceType.nom,
        description: selectedMaintenanceType.description,
        fréquence_recommandée: selectedMaintenanceType.fréquence_recommandée,
        type_intervention: selectedMaintenanceType.type_intervention,
        criticite: selectedMaintenanceType.criticite,
      };
      await request("post", "/types", data);

      await Swal.fire({
        title: "Type créé",
        text: "Le type de maintenance a été créé avec succès.",
        icon: "success",
      });

      handleCancelForm();
      fetchMaintenanceTypes();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Une erreur est survenue lors de la création.";
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateType = async () => {
    if (!validateTypeData()) return;

    if (!hasPermission('TypesMaintenances', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un type de maintenance.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer la modification",
      text: `Voulez-vous vraiment modifier le type de maintenance ${selectedMaintenanceType.nom} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, modifier",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      const data = {
        nom: selectedMaintenanceType.nom,
        description: selectedMaintenanceType.description,
        fréquence_recommandée: selectedMaintenanceType.fréquence_recommandée,
        type_intervention: selectedMaintenanceType.type_intervention,
        criticite: selectedMaintenanceType.criticite,
      };
      await request("put", `/types/${selectedMaintenanceType._id}`, data);

      await Swal.fire({
        title: "Modification confirmée",
        text: "Le type de maintenance a été modifié avec succès.",
        icon: "success",
      });

      handleCancelForm();
      fetchMaintenanceTypes();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Une erreur est survenue lors de la modification.";
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteType = async (id, nom) => {
    if (!hasPermission('TypesMaintenances', 'supprimer')) {
      toast.error("Vous n'avez pas la permission de supprimer un type de maintenance.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer la suppression",
      text: `Voulez-vous vraiment supprimer le type de maintenance ${nom} ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      await request("delete", `/types/${id}`);

      await Swal.fire({
        title: "Suppression confirmée",
        text: "Le type de maintenance a été supprimé avec succès.",
        icon: "success",
      });

      fetchMaintenanceTypes();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Une erreur est survenue lors de la suppression.";
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderAddForm = () => (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Ajouter un type de maintenance</h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          createType();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedMaintenanceType.nom}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, nom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez le nom"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Fréquence recommandée <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedMaintenanceType.fréquence_recommandée}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, fréquence_recommandée: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez la fréquence (ex. 6 mois)"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Type d'intervention <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedMaintenanceType.type_intervention}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, type_intervention: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez le type d'intervention (ex. Préventive)"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Criticité <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedMaintenanceType.criticite}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, criticite: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              required
            >
              <option value="faible">Faible</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="critique">Critique</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Description
            </label>
            <textarea
              value={selectedMaintenanceType.description}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez une description"
              rows="4"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            type="submit"
            className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : 'Créer Type'}
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
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Modifier un type de maintenance</h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          updateType();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedMaintenanceType.nom}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, nom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez le nom"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Fréquence recommandée <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedMaintenanceType.fréquence_recommandée}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, fréquence_recommandée: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez la fréquence (ex. 6 mois)"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Type d'intervention <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedMaintenanceType.type_intervention}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, type_intervention: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez le type d'intervention (ex. Préventive)"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Criticité <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedMaintenanceType.criticite}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, criticite: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              required
            >
              <option value="faible">Faible</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="critique">Critique</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Description
            </label>
            <textarea
              value={selectedMaintenanceType.description}
              onChange={(e) => setSelectedMaintenanceType({ ...selectedMaintenanceType, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrez une description"
              rows="4"
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

  if (loading) return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (!hasPermission('TypesMaintenances', 'lire')) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir la liste des types de maintenance.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen transition-all duration-300">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        {showAddForm ? (
          renderAddForm()
        ) : showEditForm ? (
          renderEditForm()
        ) : (
          <>
            <div className="flex justify-between items-center pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Liste des types de maintenance
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-200">
                  Voir les informations sur tous les types de maintenance
                </p>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Rechercher par nom"
                  className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  value={selectedInterventionType}
                  onChange={(e) => setSelectedInterventionType(e.target.value)}
                  className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les types d'intervention</option>
                  {interventionTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {hasPermission('TypesMaintenances', 'creer') && (
                  <button
                    onClick={handleAddType}
                    className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition duration-300 flex items-center space-x-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>AJOUTER UN TYPE</span>
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
                          <th
                            scope="col"
                            className="py-3.5 px-4 text-sm font-bold text-left text-gray-500 dark:text-gray-400"
                          >
                            NOM
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400"
                          >
                            FRÉQUENCE RECOMMANDÉE
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400"
                          >
                            TYPE D'INTERVENTION
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400"
                          >
                            CRITICITÉ
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400"
                          >
                            DESCRIPTION
                          </th>
                          <th
                            scope="col"
                            className="py-3.5 px-4 text-sm font-bold text-left text-gray-500 dark:text-gray-400"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                        {currentTypes.length > 0 ? (
                          currentTypes.map((type) => (
                            <tr key={type._id}>
                              <td className="px-4 py-4 text-sm font-medium text-gray-700">
                                <div className="inline-flex items-center gap-x-3">
                                  <div className="flex items-center gap-x-2">
                                    <div>
                                      <h2 className="font-medium text-gray-800 dark:text-white">
                                        {type.nom}
                                      </h2>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {type.fréquence_recommandée}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {type.type_intervention}
                              </td>
                              <td className="px-6 py-4 text-sm whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCriticiteStyles(
                                    type.criticite
                                  )}`}
                                >
                                  {type.criticite}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 line-clamp-2 overflow-hidden">
                                {type.description || 'N/A'}
                              </td>
                              <td className="px-4 py-4 text-sm whitespace-nowrap">
                                <div className="flex items-center gap-x-4">
                                  {hasPermission('TypesMaintenances', 'modifier') && (
                                    <button
                                      onClick={() => handleEditType(type)}
                                      className="text-blue-500 hover:text-blue-600 focus:outline-none"
                                      title="Modifier le type"
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
                                  {hasPermission('TypesMaintenances', 'supprimer') && (
                                    <button
                                      onClick={() => deleteType(type._id, type.nom)}
                                      className="text-red-500 hover:text-red-600 focus:outline-none"
                                      title="Supprimer le type"
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
                                </div>
                              </td>
                            </tr>
                          ))
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
                                <p className="text-gray-600 text-lg">Aucun type de maintenance trouvé.</p>
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
