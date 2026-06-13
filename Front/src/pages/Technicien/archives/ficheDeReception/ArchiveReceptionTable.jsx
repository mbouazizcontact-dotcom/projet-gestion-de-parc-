import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import usePermissions from "../../../../hooks/usePermissions";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Eye, Trash2, Search, X } from "lucide-react";

const MySwal = withReactContent(Swal);

const ArchiveReceptionTable = () => {
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
    hasPermission,
  } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [fiches, setFiches] = useState([]);
  const [filteredFiches, setFilteredFiches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const partsPerPage = 5;

  // États pour les filtres
  const [carMakeFilter, setCarMakeFilter] = useState("");
  const [licensePlateFilter, setLicensePlateFilter] = useState("");

  // Fetch fiches
  useEffect(() => {
    if (permissionsLoading || !hasPermission("FicheReceptions", "lire")) return;

    const fetchFiches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(
          "http://localhost:5000/api/reception-fiches/reception-fiche"
        );
        console.log("Fiches fetched:", response.data);
        setFiches(response.data);
        setFilteredFiches(response.data); // Initialiser les fiches filtrées avec toutes les fiches
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Impossible de charger les fiches de réception. Veuillez réessayer plus tard.";
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

    fetchFiches();
  }, [permissionsLoading, hasPermission]);

  // Gestion des filtres
  const handleFilter = () => {
    let filtered = fiches;

    if (carMakeFilter) {
      filtered = filtered.filter((fiche) =>
        fiche.carMake?.toLowerCase().includes(carMakeFilter.toLowerCase())
      );
    }

    if (licensePlateFilter) {
      filtered = filtered.filter((fiche) =>
        fiche.licensePlate?.toLowerCase().includes(licensePlateFilter.toLowerCase())
      );
    }

    setFilteredFiches(filtered);
    setCurrentPage(1); // Réinitialiser la page à 1 après filtrage
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setCarMakeFilter("");
    setLicensePlateFilter("");
    setFilteredFiches(fiches);
    setCurrentPage(1); // Réinitialiser la page à 1
  };

  // Gestion de la suppression
  const handleDelete = async (ficheId) => {
    // Vérifier la permission de suppression
    if (!hasPermission("FicheReceptions", "supprimer")) {
      MySwal.fire({
        icon: "error",
        title: "Permission refusée",
        text: "Vous n'avez pas la permission de supprimer une fiche de réception.",
        confirmButtonColor: "#6366f1",
      });
      return;
    }

    // Demander confirmation
    const result = await MySwal.fire({
      title: "Êtes-vous sûr ?",
      text: "Voulez-vous vraiment supprimer cette fiche de réception ? Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/reception-fiches/reception-fiche/${ficheId}`);
        const updatedFiches = fiches.filter((fiche) => fiche._id !== ficheId);
        setFiches(updatedFiches);
        setFilteredFiches(updatedFiches);
        toast.success("Fiche de réception supprimée avec succès.");
        MySwal.fire({
          icon: "success",
          title: "Supprimée",
          text: "La fiche de réception a été supprimée avec succès.",
          confirmButtonColor: "#6366f1",
        });
      } catch (error) {
        console.error("Erreur lors de la suppression de la fiche:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Impossible de supprimer la fiche de réception.";
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

  // Pagination basée sur les fiches filtrées
  const totalPages = Math.ceil(filteredFiches.length / partsPerPage);
  const indexOfLastFiche = currentPage * partsPerPage;
  const indexOfFirstFiche = indexOfLastFiche - partsPerPage;
  const currentFiches = filteredFiches.slice(indexOfFirstFiche, indexOfLastFiche);

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

  const viewFicheDetails = (ficheId) => {
    navigate(`/reception-fiche/${ficheId}`);
  };

  if (permissionsLoading)
    return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (permissionsError)
    return (
      <div className="p-8 text-center text-red-600">{permissionsError}</div>
    );
  if (!hasPermission("FicheReceptions", "lire")) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir l'historique des fiches de réception.
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
                Historique des fiches de réception
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-200">
                Consulter l'historique des fiches de réception pour tous les véhicules
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
                            DATE DE RÉCEPTION
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            MOTIF DE LA VISITE
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
                        {currentFiches.length > 0 ? (
                          currentFiches.map((fiche) => {
                            const reasons = [];
                            if (fiche.periodicMaintenance)
                              reasons.push("Entretien périodique");
                            if (fiche.mechanicalRepair)
                              reasons.push("Réparation mécanique");
                            if (fiche.electricalIssue)
                              reasons.push("Problème électrique");
                            if (fiche.otherReason && fiche.otherReasonText)
                              reasons.push(`Autre: ${fiche.otherReasonText}`);
                            return (
                              <tr key={fiche._id}>
                                <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  {fiche.carMake || "N/A"}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  {fiche.licensePlate || "N/A"}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  {fiche.date
                                    ? new Date(fiche.date).toLocaleDateString(
                                        "fr-FR"
                                      )
                                    : "N/A"}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                                  {reasons.length > 0
                                    ? reasons.join(", ")
                                    : "N/A"}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  {fiche.mileage
                                    ? `${fiche.mileage} km`
                                    : "N/A"}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap flex space-x-2">
                                  <button
                                    onClick={() => viewFicheDetails(fiche._id)}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all flex items-center"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Voir
                                  </button>
                                  {hasPermission("FicheReceptions", "supprimer") && (

                                  <button
                                    onClick={() => handleDelete(fiche._id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all flex items-center"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Supprimer
                                  </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
                              className="py-6 text-center text-gray-500"
                            >
                              Aucune fiche de réception trouvée.
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

export default ArchiveReceptionTable;