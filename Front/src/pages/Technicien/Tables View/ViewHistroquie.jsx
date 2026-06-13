import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import usePermissions from "../../../hooks/usePermissions";
import { CSVLink } from "react-csv";

const MySwal = withReactContent(Swal);

const ViewHistorique = () => {
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
    hasPermission,
  } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [maintenances, setMaintenances] = useState([]);
  const [filteredMaintenances, setFilteredMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [filteredMechanics, setFilteredMechanics] = useState([]);
  const [garages, setGarages] = useState([]);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedMechanicFilter, setSelectedMechanicFilter] = useState("");
  const [selectedGarageFilter, setSelectedGarageFilter] = useState("");
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const vehicleInputRef = useRef(null);
  const partsPerPage = 5;

  // Fetch data
  useEffect(() => {
    if (permissionsLoading || !hasPermission("maintenance", "lire")) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await Promise.all([
          fetchMaintenances(),
          fetchVehicles(),
          fetchMechanics(),
          fetchGarages(),
        ]);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Impossible de charger les données. Veuillez réessayer plus tard.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [permissionsLoading, hasPermission]);

  // Filter vehicles based on search query
  useEffect(() => {
    if (vehicleSearch.trim() === "") {
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

  // Filter mechanics based on selected garage and reset mechanic filter if needed
  useEffect(() => {
    if (selectedGarageFilter) {
      const mechanicsInGarage = mechanics.filter(
        (mechanic) => mechanic.garage?._id === selectedGarageFilter
      );
      setFilteredMechanics(mechanicsInGarage);
      // Reset selected mechanic if not in filtered list
      if (
        selectedMechanicFilter &&
        !mechanicsInGarage.some((m) => m._id === selectedMechanicFilter)
      ) {
        setSelectedMechanicFilter("");
      }
    } else {
      setFilteredMechanics(mechanics);
    }
  }, [selectedGarageFilter, mechanics, selectedMechanicFilter]);

  // Filter maintenances based on selected vehicle, mechanic, and garage
  useEffect(() => {
    let filtered = maintenances;

    if (selectedVehicleFilter) {
      filtered = filtered.filter(
        (m) => m.vehicule?._id === selectedVehicleFilter
      );
    }

    if (selectedMechanicFilter) {
      filtered = filtered.filter(
        (m) => m.mechanic?._id === selectedMechanicFilter
      );
    }

    if (selectedGarageFilter) {
      filtered = filtered.filter(
        (m) => m.garage?._id === selectedGarageFilter
      );
    }

    setFilteredMaintenances(filtered);
  }, [selectedVehicleFilter, selectedMechanicFilter, selectedGarageFilter, maintenances]);

  // Close vehicle dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        vehicleInputRef.current &&
        !vehicleInputRef.current.contains(event.target)
      ) {
        setShowVehicleDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchMaintenances = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/maintenance/maintenances",
        {
          params: { statut: "Terminée" },
        }
      );
      setMaintenances(response.data);
      setFilteredMaintenances(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des maintenances"
      );
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/vehicules/all"
      );
      setVehicles(response.data);
      setFilteredVehicles(response.data);
    } catch (error) {
      toast.error("Impossible de charger les véhicules.");
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des véhicules"
      );
    }
  };

  const fetchMechanics = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/mecaniciens"
      );
      setMechanics(response.data);
      setFilteredMechanics(response.data);
    } catch (error) {
      toast.error("Impossible de charger les mécaniciens.");
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des mécaniciens"
      );
    }
  };

  const fetchGarages = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/garages");
      setGarages(response.data);
    } catch (error) {
      toast.error("Impossible de charger les garages.");
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des garages"
      );
    }
  };

  // Préparer les données pour l'export CSV
  const csvData = filteredMaintenances.map((maintenance) => ({
    Véhicule: `${maintenance?.vehicule?.marque || "N/A"} ${maintenance?.vehicule?.modele || ""} (${maintenance?.vehicule?.immatriculation || "N/A"})`,
    "Type d'intervention": maintenance?.typeMaintenance?.type_intervention || "N/A",
    "Nom d'intervention": maintenance?.typeMaintenance?.nom || "N/A",
    Mécanicien: maintenance?.mechanic ? `${maintenance.mechanic.nom || ""} ${maintenance.mechanic.prenom || ""}`.trim() : "Non assigné",
    Garage: maintenance?.garage ? `${maintenance.garage.nom || ""} ${maintenance.garage.adresse ? `(${maintenance.garage.adresse})` : ""}`.trim() : "Non assigné",
    "Date Prévue": maintenance?.datePrevue ? new Date(maintenance.datePrevue).toLocaleDateString('fr-FR') : "N/A",
    "Date de Réservation": maintenance?.dateReservation ? new Date(maintenance.dateReservation).toLocaleDateString('fr-FR') : "N/A",
    Statut: maintenance?.statut || "N/A",
    Notes: maintenance?.notes || "N/A",
    Kilométrage: maintenance?.kilometrage ? `${maintenance.kilometrage} km` : "N/A",
  }));

  const totalPages = Math.ceil(filteredMaintenances.length / partsPerPage);
  const indexOfLastMaintenance = currentPage * partsPerPage;
  const indexOfFirstMaintenance = indexOfLastMaintenance - partsPerPage;
  const currentMaintenances = filteredMaintenances.slice(
    indexOfFirstMaintenance,
    indexOfLastMaintenance
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleExportConfirmation = () => {
    MySwal.fire({
      title: "Confirmer l'exportation",
      text: "Voulez-vous exporter l'historique des maintenances terminées en CSV ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, exporter",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        document.getElementById("csv-export-link").click();
        Swal.fire({
          title: "Exportation réussie",
          text: "Les données ont été exportées avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const getStatusStyles = (statut) => {
    switch (statut) {
      case "Backlog":
        return "bg-blue-100 text-blue-800";
      case "En cours":
        return "bg-yellow-100 text-yellow-800";
      case "Terminée":
        return "bg-green-100 text-green-800";
      case "Annulée":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInterventionTypeStyles = (typeIntervention) => {
    switch (typeIntervention) {
      case "Préventive":
        return "border-blue-500 bg-blue-100 text-blue-700";
      case "Corrective":
        return "border-red-500 bg-red-100 text-red-700";
      case "Conditionnelle":
        return "border-yellow-500 bg-yellow-100 text-yellow-700";
      case "Périodique":
        return "border-green-500 bg-green-100 text-green-700";
      case "Sécurité":
        return "border-orange-500 bg-orange-100 text-orange-700";
      default:
        return "border-gray-500 bg-gray-100 text-gray-700";
    }
  };

  if (permissionsLoading)
    return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (permissionsError)
    return (
      <div className="p-8 text-center text-red-600">{permissionsError}</div>
    );
  if (!hasPermission("maintenance", "lire")) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir l'historique des maintenances.
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
                Historique des maintenances terminées
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-200">
                Consulter l'historique des maintenances terminées pour tous les véhicules
              </p>
            </div>
            <button
              onClick={handleExportConfirmation}
              className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition duration-300 flex items-center space-x-2"
              disabled={isLoading}
            >
              <span>EXPORTER CSV</span>
            </button>
            <CSVLink
              id="csv-export-link"
              data={csvData}
              filename="historique_maintenances_terminees.csv"
              className="hidden"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative" ref={vehicleInputRef}>
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
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredVehicles.length > 0 ? (
                    filteredVehicles.map((vehicle) => (
                      <div
                        key={vehicle._id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedVehicleFilter(vehicle._id);
                          setVehicleSearch(
                            `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
                          );
                          setShowVehicleDropdown(false);
                        }}
                      >
                        {vehicle.marque} {vehicle.modele} (
                        {vehicle.immatriculation})
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      Aucun véhicule trouvé
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1">
              <select
                value={selectedGarageFilter}
                onChange={(e) => setSelectedGarageFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              >
                <option value="">Tous les garages</option>
                {garages.map((garage) => (
                  <option key={garage._id} value={garage._id}>
                    {garage.nom} ({garage.adresse})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select
                value={selectedMechanicFilter}
                onChange={(e) => setSelectedMechanicFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                disabled={selectedGarageFilter && filteredMechanics.length === 0}
              >
                <option value="">Tous les mécaniciens</option>
                {filteredMechanics.map((mechanic) => (
                  <option key={mechanic._id} value={mechanic._id}>
                    {mechanic.nom} {mechanic.prenom}
                  </option>
                ))}
              </select>
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
                            TYPE D'INTERVENTION
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            NOM D'INTERVENTION
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            MÉCANICIEN
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            GARAGE
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            DATE PRÉVUE
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            DATE DE RÉSERVATION
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            STATUT
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            NOTES
                          </th>
                          <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                            KILOMÉTRAGE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900">
                        {currentMaintenances.length > 0 ? (
                          currentMaintenances.map((maintenance) => (
                            <tr key={maintenance._id}>
                              <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {maintenance.vehicule?.marque || "N/A"}{" "}
                                {maintenance.vehicule?.modele || ""} (
                                {maintenance.vehicule?.immatriculation || "N/A"}
                                )
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium border-2 ${getInterventionTypeStyles(
                                    maintenance.typeMaintenance?.type_intervention
                                  )}`}
                                  aria-label={`Type d'intervention: ${
                                    maintenance.typeMaintenance?.type_intervention || "N/A"
                                  }`}
                                >
                                  {maintenance.typeMaintenance?.type_intervention || "N/A"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                                {maintenance.typeMaintenance?.nom || "N/A"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                                {maintenance.mechanic
                                  ? `${maintenance.mechanic.nom || ""} ${
                                      maintenance.mechanic.prenom || ""
                                    }`.trim()
                                  : "Non assigné"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                                {maintenance.garage
                                  ? `${maintenance.garage.nom || ""} ${
                                      maintenance.garage.adresse
                                        ? `(${maintenance.garage.adresse})`
                                        : ""
                                    }`.trim()
                                  : "Non assigné"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {maintenance.datePrevue
                                  ? new Date(maintenance.datePrevue).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {maintenance.dateReservation
                                  ? new Date(maintenance.dateReservation).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="py-4 px-6 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                                    maintenance.statut
                                  )}`}
                                >
                                  {maintenance.statut || "N/A"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 line-clamp-2 overflow-hidden">
                                {maintenance.notes || "N/A"}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {maintenance.kilometrage
                                  ? `${maintenance.kilometrage} km`
                                  : "N/A"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="10"
                              className="py-6 text-center text-gray-500"
                            >
                              Aucune maintenance terminée trouvée.
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

export default ViewHistorique;