import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import usePermissions from "../../../../hooks/usePermissions";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Eye, Trash2, Search, X, Wrench } from "lucide-react";

const MySwal = withReactContent(Swal);

const ArchiveRepairInterventionTable = () => {
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
    hasPermission,
  } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [interventions, setInterventions] = useState([]);
  const [filteredInterventions, setFilteredInterventions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const partsPerPage = 5;

  // États pour les filtres
  const [carMakeFilter, setCarMakeFilter] = useState("");
  const [licensePlateFilter, setLicensePlateFilter] = useState("");

  // Fetch interventions
  useEffect(() => {
    if (permissionsLoading || !hasPermission("FicheInterventions", "lire")) return;

    const fetchInterventions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(
          "http://localhost:5000/api/repair-interventions"
        );
        console.log("Interventions fetched:", response.data);
        setInterventions(response.data);
        setFilteredInterventions(response.data);
      } catch (err) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          "Impossible de charger les fiches d'intervention. Veuillez réessayer plus tard.";
        console.error("Erreur lors du chargement des fiches:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterventions();
  }, [permissionsLoading, hasPermission]);

  // Gestion des filtres
  const handleFilter = () => {
    let filtered = interventions;

    if (carMakeFilter) {
      filtered = filtered.filter((intervention) =>
        intervention.carMake?.toLowerCase().includes(carMakeFilter.toLowerCase())
      );
    }

    if (licensePlateFilter) {
      filtered = filtered.filter((intervention) =>
        intervention.licensePlate?.toLowerCase().includes(licensePlateFilter.toLowerCase())
      );
    }

    setFilteredInterventions(filtered);
    setCurrentPage(1);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setCarMakeFilter("");
    setLicensePlateFilter("");
    setFilteredInterventions(interventions);
    setCurrentPage(1);
  };

  // Gestion de la suppression
  const handleDelete = async (interventionId) => {
    if (!hasPermission("FicheInterventions", "supprimer")) {
      MySwal.fire({
        icon: "error",
        title: "Permission refusée",
        text: "Vous n'avez pas la permission de supprimer une fiche d'intervention.",
        confirmButtonColor: "#6366f1",
      });
      return;
    }

    const result = await MySwal.fire({
      title: "Êtes-vous sûr ?",
      text: "Voulez-vous vraiment supprimer cette fiche d'intervention ? Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/repair-interventions/${interventionId}`);
        const updatedInterventions = interventions.filter((intervention) => intervention._id !== interventionId);
        setInterventions(updatedInterventions);
        setFilteredInterventions(updatedInterventions);
        toast.success("Fiche d'intervention supprimée avec succès.");
        MySwal.fire({
          icon: "success",
          title: "Supprimée",
          text: "La fiche d'intervention a été supprimée avec succès.",
          confirmButtonColor: "#6366f1",
        });
      } catch (error) {
        console.error("Erreur lors de la suppression de la fiche:", error);
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Impossible de supprimer la fiche d'intervention.";
        toast.error(errorMessage);
        MySwal.fire({
          icon: "error",
          title: "Erreur",
          text: errorMessage,
          confirmButtonColor: "#6366f1",
        });
      }
    }
  };

  // Pagination basée sur les interventions filtrées
  const totalPages = Math.ceil(filteredInterventions.length / partsPerPage);
  const indexOfLastIntervention = currentPage * partsPerPage;
  const indexOfFirstIntervention = indexOfLastIntervention - partsPerPage;
  const currentInterventions = filteredInterventions.slice(indexOfFirstIntervention, indexOfLastIntervention);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      console.log("Navigating to next page:", currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      console.log("Navigating to previous page:", currentPage - 1);
    }
  };

  const viewInterventionDetails = (interventionId) => {
    navigate(`/view-repair-intervention/${interventionId}`);
  };

  if (permissionsLoading)
    return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (permissionsError)
    return (
      <div className="p-8 text-center text-red-600">{permissionsError}</div>
    );
  if (!hasPermission("FicheInterventions", "lire")) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir l'historique des fiches d'intervention.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen transition-all duration-300">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="pb-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Historique des fiches d'intervention
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-200">
                Consulter l'historique des fiches d'intervention pour tous les véhicules
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire de filtrage */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Filtrer les fiches
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="carMakeFilter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Véhicule (Marque/Modèle)
              </label>
              <input
                id="carMakeFilter"
                type="text"
                value={carMakeFilter}
                onChange={(e) => setCarMakeFilter(e.target.value)}
                placeholder="Ex: Toyota Corolla"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="licensePlateFilter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Immatriculation
              </label>
              <input
                id="licensePlateFilter"
                type="text"
                value={licensePlateFilter}
                onChange={(e) => setLicensePlateFilter(e.target.value)}
                placeholder="Ex: AB-123-CD"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 transition-all"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all flex items-center"
              >
                <Search className="h-4 w-4 mr-2" />
                Filtrer
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-all flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 mt-4 text-center">{error}</div>
        )}
        {isLoading ? (
          <div className="text-center mt-6">Chargement des données...</div>
        ) : (
          <>
            <div className="flex flex-col mt-6">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg">
                    <table className="min-w-full dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="py-3.5 px-4 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            VÉHICULE
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            IMMATRICULATION
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            DATE D'INTERVENTION
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            GARAGISTE
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            KILOMÉTRAGE
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900">
                        {currentInterventions.length > 0 ? (
                          currentInterventions.map((intervention) => (
                            <tr key={intervention._id}>
                              <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {intervention.carMake || "N/A"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {intervention.licensePlate || "N/A"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {intervention.date
                                  ? new Date(intervention.date).toLocaleDateString("fr-FR")
                                  : "N/A"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                                {intervention.mechanic || "N/A"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {intervention.mileage
                                  ? `${intervention.mileage} km`
                                  : "N/A"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap flex space-x-2">
                                <button
                                  onClick={() => viewInterventionDetails(intervention._id)}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all flex items-center"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Voir
                                </button>

                                {hasPermission("FicheInterventions", "supprimer") && (

                                <button
                                
                                  onClick={() => handleDelete(intervention._id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all flex items-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
                              className="py-6 text-center text-gray-500"
                            >
                              Aucune fiche d'intervention trouvée.
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
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 dark:text-gray-200 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300 disabled:opacity-50"
              >
                <span className="mr-2">←</span>PRÉCÉDENTE
              </button>
              <span className="text-sm dark:text-gray-200 text-gray-500">
                Page {currentPage} sur {totalPages || 1}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 dark:text-gray-200 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300 disabled:opacity-50"
              >
                SUIVANTE <span className="ml-2">→</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ArchiveRepairInterventionTable;