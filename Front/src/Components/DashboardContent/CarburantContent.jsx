import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import {
  FaGasPump,
  FaChartLine,
  FaHistory,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import usePermissions from "../../hooks/usePermissions";

const CarburantContent = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consommationData, setConsommationData] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCarburant, setSelectedCarburant] = useState(null);
  const [vehicules, setVehicules] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedFuelType, setSelectedFuelType] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [groupStats, setGroupStats] = useState({});
  const dropdownRef = useRef(null);
  const { permissions, hasPermission } = usePermissions();

  const [formData, setFormData] = useState({
    vehicule: "",
    date: "",
    quantite: "",
    cout: "",
    lastKilometrage: "",
    kilometrage: "",
    typeCarburant: "Essence",
  });

  const [statsCards, setStatsCards] = useState([
    {
      title: "Total Consommation",
      value: "0 L",
      icon: <FaGasPump className="text-blue-600" />,
    },
    {
      title: "Coût Total",
      value: "0 DT",
      icon: <FaChartLine className="text-green-600" />,
    },
    {
      title: "Consommation Moyenne",
      value: "Non calculable",
      description:
        "Ajoutez au moins deux enregistrements avec des kilométrages croissants pour calculer.",
      icon: <FaHistory className="text-purple-600" />,
    },
  ]);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [groupCurrentPage, setGroupCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Styles pour les types de carburant
  const fuelTypeStyles = {
    Essence: "bg-green-100 text-green-800",
    Diesel: "bg-blue-100 text-blue-800",
    GAZ: "bg-orange-100 text-orange-800",
    Électrique: "bg-purple-100 text-purple-800",
  };

  const calculateKPIs = useCallback(() => {
    if (!consommationData.length) {
      setStatsCards([
        {
          title: "Total Consommation",
          value: "0 L",
          icon: <FaGasPump className="text-blue-600" />,
        },
        {
          title: "Coût Total",
          value: "0 DT",
          icon: <FaChartLine className="text-green-600" />,
        },
        {
          title: "Consommation Moyenne",
          value: "Non calculable",
          description:
            "Ajoutez au moins deux enregistrements avec des kilométrages croissants pour calculer.",
          icon: <FaHistory className="text-purple-600" />,
        },
      ]);
      return;
    }

    const totalConsommation = consommationData.reduce(
      (sum, item) => sum + Number(item.quantite) || 0,
      0
    );

    const totalCout = consommationData.reduce(
      (sum, item) => sum + Number(item.cout) || 0,
      0
    );

    const consommationByVehicle = {};
    consommationData.forEach((item) => {
      const vehiculeId = item.vehicule?._id;
      if (!vehiculeId) return;
      if (!consommationByVehicle[vehiculeId]) {
        consommationByVehicle[vehiculeId] = [];
      }
      consommationByVehicle[vehiculeId].push({
        date: new Date(item.date),
        quantite: Number(item.quantite) || 0,
        kilometrage: Number(item.kilometrage) || 0,
      });
    });

    let totalQuantite = 0;
    let totalDistance = 0;
    Object.values(consommationByVehicle).forEach((records) => {
      if (records.length < 2) return;
      records.sort((a, b) => a.date - b.date);
      let vehicleQuantite = 0;
      let vehicleDistance = 0;
      for (let i = 1; i < records.length; i++) {
        const current = records[i];
        const previous = records[i - 1];
        const distance = current.kilometrage - previous.kilometrage;
        if (distance > 0) {
          vehicleDistance += distance;
          vehicleQuantite += current.quantite;
        }
      }
      if (vehicleDistance > 0) {
        totalQuantite += vehicleQuantite;
        totalDistance += vehicleDistance;
      }
    });

    const consommationMoyenne = totalDistance > 0 ? (totalQuantite / totalDistance) * 100 : 0;

    setStatsCards([
      {
        title: "Total Consommation",
        value: `${totalConsommation.toFixed(2)} L`,
        icon: <FaGasPump className="text-blue-600" />,
      },
      {
        title: "Coût Total",
        value: `${totalCout.toFixed(2)} DT`,
        icon: <FaChartLine className="text-green-600" />,
      },
      {
        title: "Consommation Moyenne",
        value:
          totalDistance > 0
            ? `${consommationMoyenne.toFixed(2)} L/100km`
            : "Non calculable",
        description:
          totalDistance > 0
            ? ""
            : "Ajoutez au moins deux enregistrements avec des kilométrages croissants pour calculer.",
        icon: <FaHistory className="text-purple-600" />,
      },
    ]);
  }, [consommationData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const vehiculeResponse = await axios.get(
        "http://localhost:5000/api/vehicules/all",
        {
          headers,
          params: { populate: "proprietaire conducteur" },
        }
      );
      let vehiclesData = Array.isArray(vehiculeResponse.data)
        ? vehiculeResponse.data
        : vehiculeResponse.data?.data || [];
      setVehicules(vehiclesData);

      const consommationResponse = await axios.get(
        "http://localhost:5000/api/carburant",
        { headers }
      );
      const consommationData = Array.isArray(consommationResponse.data)
        ? consommationResponse.data
        : consommationResponse.data?.data || [];
      setConsommationData(consommationData);

      const stats = {};
      consommationData.forEach((consommation) => {
        const vehicule = vehiclesData.find(
          (v) => v._id === consommation.vehicule?._id
        );
        if (vehicule?.proprietaire) {
          const groupeId = vehicule.proprietaire._id;
          if (!stats[groupeId]) {
            stats[groupeId] = {
              nom: vehicule.proprietaire.nom,
              totalConsommation: 0,
              totalCout: 0,
              vehicules: new Set(),
            };
          }
          stats[groupeId].totalConsommation +=
            Number(consommation.quantite) || 0;
          stats[groupeId].totalCout += Number(consommation.cout) || 0;
          stats[groupeId].vehicules.add(vehicule._id);
        }
      });
      setGroupStats(stats);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      toast.error("Erreur lors du chargement des données: " + err.message);
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!hasPermission('Carburant', 'lire')) return;
    fetchData();
  }, [hasPermission]);
  

  useEffect(() => {
    calculateKPIs();
  }, [consommationData, calculateKPIs]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowVehicleDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!selectedCarburant;

    // Vérifier les permissions
    if (!hasPermission("Carburant", isEdit ? "modifier" : "creer")) {
      toast.error(
        `Vous n'avez pas la permission de ${
          isEdit ? "modifier" : "ajouter"
        } une consommation.`
      );
      return;
    }

    if (Number(formData.lastKilometrage) >= Number(formData.kilometrage)) {
      toast.error("Le kilométrage doit être supérieur au dernier enregistré");
      return;
    }

    const result = await Swal.fire({
      title: isEdit ? "Confirmer la modification" : "Confirmer l'ajout",
      text: isEdit
        ? "Êtes-vous sûr de vouloir modifier cette consommation ?"
        : "Êtes-vous sûr de vouloir ajouter cette consommation ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: isEdit ? "Oui, modifier" : "Oui, ajouter",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (selectedCarburant) {
        const response = await axios.put(
          `http://localhost:5000/api/carburant/${selectedCarburant._id}`,
          formData,
          { headers }
        );
        toast.success("Consommation modifiée avec succès");
        setConsommationData((prev) =>
          prev.map((item) =>
            item._id === response.data._id ? response.data : item
          )
        );
      } else {
        const response = await axios.post(
          "http://localhost:5000/api/carburant",
          formData,
          { headers }
        );
        toast.success("Consommation ajoutée avec succès");
        setConsommationData((prev) => [response.data, ...prev]);
      }

      setShowAddForm(false);
      setShowEditForm(false);
      setFormData({
        vehicule: "",
        date: "",
        quantite: "",
        cout: "",
        lastKilometrage: "",
        kilometrage: "",
        typeCarburant: "Essence",
      });
      setSelectedCarburant(null);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Une erreur est survenue";
      toast.error(errorMessage);
      Swal.fire("Erreur", errorMessage, "error");
    }
  };

  const handleDelete = async (id) => {
    // Vérifier la permission de suppression
    if (!hasPermission("Carburant", "supprimer")) {
      toast.error("Vous n'avez pas la permission de supprimer une consommation.");
      return;
    }

    const result = await Swal.fire({
      title: "Confirmer la suppression",
      text: "Êtes-vous sûr de vouloir supprimer cette consommation ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`http://localhost:5000/api/carburant/${id}`, {
          headers,
        });
        toast.success("Consommation supprimée avec succès");
        setConsommationData((prev) => prev.filter((item) => item._id !== id));
        Swal.fire("Supprimé !", "La consommation a été supprimée.", "success");
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Erreur lors de la suppression";
        toast.error(errorMessage);
        Swal.fire("Erreur", errorMessage, "error");
      }
    }
  };

  const VehicleSelect = ({ value, onChange }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const inputRef = useRef(null);
    const isSearching = useRef(false);

    const selectedVehicle = useMemo(() => {
      return vehicules.find((v) => v._id === value);
    }, [value, vehicules]);

    const filteredVehicles = useMemo(() => {
      return vehicules.filter((vehicule) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          vehicule.marque?.toLowerCase().includes(searchLower) ||
          vehicule.modele?.toLowerCase().includes(searchLower) ||
          vehicule.immatriculation?.toLowerCase().includes(searchLower);

        if (selectedGroup) {
          return matchesSearch && vehicule.proprietaire?._id === selectedGroup;
        }
        return matchesSearch;
      });
    }, [searchQuery, selectedGroup, vehicules]);

    const handleSelect = useCallback(
      (vehicule) => {
        onChange(vehicule._id);
        setSearchQuery("");
        setShowVehicleDropdown(false);
        isSearching.current = false;
      },
      [onChange]
    );

    const handleInputChange = useCallback((e) => {
      setSearchQuery(e.target.value);
      isSearching.current = true;
      setShowVehicleDropdown(true);
    }, []);

    const handleInputFocus = useCallback(() => {
      if (!isSearching.current && selectedVehicle) {
        setSearchQuery("");
      }
      setShowVehicleDropdown(true);
      isSearching.current = true;
    }, [selectedVehicle]);

    const handleInputBlur = useCallback(() => {
      if (selectedVehicle && !searchQuery) {
        isSearching.current = false;
      }
    }, [selectedVehicle, searchQuery]);

    return (
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            ref={inputRef}
            value={
              isSearching.current
                ? searchQuery
                : selectedVehicle
                ? `${selectedVehicle.marque} ${selectedVehicle.modele} (${selectedVehicle.immatriculation})`
                : ""
            }
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Rechercher ou sélectionner un véhicule..."
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>

        {showVehicleDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicule) => (
                <div
                  key={vehicule._id}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onMouseDown={() => handleSelect(vehicule)}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      {vehicule.marque} {vehicule.modele} (
                      {vehicule.immatriculation})
                    </span>
                    <span className="text-sm text-gray-500">
                      {vehicule.proprietaire?.nom || "Sans groupe"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Kilométrage: {vehicule.kilometrage || "Non renseigné"} km
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-600" />
                <span>Aucun véhicule ne correspond à votre recherche</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const VehicleFilterSelect = ({ value, onChange }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    const selectedVehicle = useMemo(() => {
      return value ? vehicules.find((v) => v._id === value) : null;
    }, [value, vehicules]);

    const filteredVehicles = useMemo(() => {
      return vehicules.filter((vehicule) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          vehicule.marque?.toLowerCase().includes(searchLower) ||
          vehicule.modele?.toLowerCase().includes(searchLower) ||
          vehicule.immatriculation?.toLowerCase().includes(searchLower);

        if (selectedGroup) {
          return matchesSearch && vehicule.proprietaire?._id === selectedGroup;
        }
        return matchesSearch;
      });
    }, [searchQuery, selectedGroup, vehicules]);

    const handleSelect = useCallback(
      (vehiculeId) => {
        onChange(vehiculeId);
        setSearchQuery("");
        setShowDropdown(false);
      },
      [onChange]
    );

    const handleInputChange = useCallback((e) => {
      setSearchQuery(e.target.value);
      setShowDropdown(true);
    }, []);

    const handleInputFocus = useCallback(() => {
      setShowDropdown(true);
    }, []);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setShowDropdown(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            ref={inputRef}
            value={
              searchQuery ||
              (selectedVehicle
                ? `${selectedVehicle.marque} ${selectedVehicle.modele} (${selectedVehicle.immatriculation})`
                : "Tous les véhicules")
            }
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="Rechercher ou sélectionner un véhicule..."
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>

        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onMouseDown={() => handleSelect("")}
            >
              Tous les véhicules
            </div>
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicule) => (
                <div
                  key={vehicule._id}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onMouseDown={() => handleSelect(vehicule._id)}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      {vehicule.marque} {vehicule.modele} (
                      {vehicule.immatriculation})
                    </span>
                    <span className="text-sm text-gray-500">
                      {vehicule.proprietaire?.nom || "Sans groupe"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Kilométrage: {vehicule.kilometrage || "Non renseigné"} km
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-600" />
                <span>Aucun véhicule ne correspond à votre recherche</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredData = useMemo(() => {
    return consommationData.filter((consommation) => {
      const vehicule = consommation.vehicule;
      const matchesVehicle =
        !selectedVehicle || vehicule?._id === selectedVehicle;
      const matchesGroup =
        !selectedGroup || vehicule?.proprietaire?._id === selectedGroup;
      const matchesFuelType =
        !selectedFuelType || consommation.typeCarburant === selectedFuelType;

      return matchesVehicle && matchesGroup && matchesFuelType;
    });
  }, [consommationData, selectedVehicle, selectedGroup, selectedFuelType]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const groupData = Object.entries(groupStats);
  const groupTotalPages = Math.ceil(groupData.length / itemsPerPage);
  const groupIndexOfLastItem = groupCurrentPage * itemsPerPage;
  const groupIndexOfFirstItem = groupIndexOfLastItem - itemsPerPage;
  const paginatedGroupData = groupData.slice(
    groupIndexOfFirstItem,
    groupIndexOfLastItem
  );

  const handleGroupNextPage = () => {
    if (groupCurrentPage < groupTotalPages)
      setGroupCurrentPage(groupCurrentPage + 1);
  };

  const handleGroupPrevPage = () => {
    if (groupCurrentPage > 1) setGroupCurrentPage(groupCurrentPage - 1);
  };

  if (loading)
    return <div className="text-center p-8">Chargement des données...</div>;
  if (error)
    return <div className="text-center p-8 text-red-600">Erreur: {error}</div>;

  return (
    <div className="relative">
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({
                  vehicule: "",
                  date: "",
                  quantite: "",
                  cout: "",
                  kilometrage: "",
                  typeCarburant: "Essence",
                });
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Ajouter une Consommation
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Véhicule*
                </label>
                <VehicleSelect
                  value={formData.vehicule}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      vehicule: value,
                      kilometrage:
                        vehicules.find((v) => v._id === value)?.kilometrage ||
                        "",
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Date*
                </label>
                <input
                  type="date"
                  value={formData.date}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Quantité (L)*
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantite}
                  onChange={(e) =>
                    setFormData({ ...formData, quantite: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Coût (DT)*
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cout}
                  onChange={(e) =>
                    setFormData({ ...formData, cout: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Kilométrage*
                </label>
                <input
                  type="number"
                  value={formData.kilometrage}
                  onChange={(e) =>
                    setFormData({ ...formData, kilometrage: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Type de Carburant*
                </label>
                <select
                  value={formData.typeCarburant}
                  onChange={(e) =>
                    setFormData({ ...formData, typeCarburant: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Essence">Essence</option>
                  <option value="Diesel">Diesel</option>
                  <option value="GAZ">GAZ</option>
                  <option value="Électrique">Électrique</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => {
                setShowEditForm(false);
                setSelectedCarburant(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Modifier la Consommation
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Véhicule*
                </label>
                <VehicleSelect
                  value={formData.vehicule}
                  onChange={(value) => {
                    setFormData({
                      ...formData,
                      vehicule: value,
                      kilometrage:
                        vehicules.find((v) => v._id === value)?.kilometrage ||
                        "",
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Date*
                </label>
                <input
                  type="date"
                  value={formData.date}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Quantité (L)*
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantite}
                  onChange={(e) =>
                    setFormData({ ...formData, quantite: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Coût (DT)*
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cout}
                  onChange={(e) =>
                    setFormData({ ...formData, cout: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Kilométrage*
                </label>
                <input
                  type="number"
                  value={formData.kilometrage}
                  onChange={(e) => {
                    setFormData({ ...formData, kilometrage: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Type de Carburant*
                </label>
                <select
                  value={formData.typeCarburant}
                  onChange={(e) =>
                    setFormData({ ...formData, typeCarburant: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Essence">Essence</option>
                  <option value="Diesel">Diesel</option>
                  <option value="GAZ">GAZ</option>
                  <option value="Électrique">Électrique</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div
        className={`space-y-6 ${showAddForm || showEditForm ? "blur-lg" : ""}`}
      >
        {/* Conditionner l'affichage du bouton "Ajouter une consommation" */}
        {hasPermission("Carburant", "creer") && (
          <div className="flex justify-end items-center">
            <button
              onClick={() => {
                setFormData({
                  vehicule: "",
                  date: new Date().toISOString().split("T")[0],
                  quantite: "",
                  cout: "",
                  kilometrage: "",
                  typeCarburant: "Essence",
                });
                setShowAddForm(true);
                setShowEditForm(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              <span>Ajouter une consommation</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  {stat.icon}
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.trendUp ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              {stat.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {stat.description}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Consommation par Groupe
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Groupe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Véhicules
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Consommation (L)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Coût Total (DT)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedGroupData.map(([groupeId, stats]) => (
                    <tr key={groupeId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {stats.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {stats.vehicules.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {stats.totalConsommation.toFixed(2)} L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {stats.totalCout.toFixed(2)} DT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {groupTotalPages > 1 && (
              <div className="flex justify-between items-center py-4">
                <button
                  className="px-4 py-2 dark:text-gray-200 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                  onClick={handleGroupPrevPage}
                  disabled={groupCurrentPage === 1}
                >
                  <span className="mr-2">←</span>PRÉCÉDENTE
                </button>
                <span className="text-sm dark:text-gray-200 text-gray-500">
                  Page {groupCurrentPage} sur {groupTotalPages || 1}
                </span>
                <button
                  className="px-4 py-2 dark:text-gray-200 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                  onClick={handleGroupNextPage}
                  disabled={
                    groupCurrentPage === groupTotalPages || groupTotalPages === 0
                  }
                >
                  SUIVANTE <span className="ml-2">→</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Historique des Consommations
              </h2>
              <div className="flex gap-4">
                <select
                  value={selectedGroup}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les groupes</option>
                  {Object.entries(groupStats).map(([groupeId, stats]) => (
                    <option key={groupeId} value={groupeId}>
                      {stats.nom}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedFuelType}
                  onChange={(e) => {
                    setSelectedFuelType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les types de carburant</option>
                  <option value="Essence">Essence</option>
                  <option value="Diesel">Diesel</option>
                  <option value="GAZ">GAZ</option>
                  <option value="Électrique">Électrique</option>
                </select>
                <VehicleFilterSelect
                  value={selectedVehicle}
                  onChange={(value) => {
                    setSelectedVehicle(value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Groupe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantité (L)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Coût (DT)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kilométrage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center p-6 text-yellow-800 text-center max-w-md mx-auto">
                          <FaExclamationTriangle className="w-8 h-8 text-yellow-500 mb-2" />
                          <p className="font-medium text-sm">
                            Aucun enregistrement ne correspond aux filtres
                            appliqués.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item) => (
                      <tr key={item._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(item.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.vehicule
                            ? `${item.vehicule.marque} ${item.vehicule.modele} (${item.vehicule.immatriculation})`
                            : "Véhicule inconnu"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.vehicule?.proprietaire?.nom || "Sans groupe"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.quantite} L
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.cout} DT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.kilometrage} km
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              fuelTypeStyles[item.typeCarburant] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.typeCarburant}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            {/* Bouton Modifier : Affiché si permission carburant.modifier */}
                            {hasPermission("Carburant", "modifier") && (
                              <button
                                onClick={() => {
                                  setSelectedCarburant(item);
                                  setFormData({
                                    vehicule: item.vehicule?._id || "",
                                    date: new Date(item.date)
                                      .toISOString()
                                      .split("T")[0],
                                    quantite: item.quantite,
                                    cout: item.cout,
                                    lastKilometrage: item.kilometrage,
                                    kilometrage: item.kilometrage,
                                    typeCarburant:
                                      item.typeCarburant || "Essence",
                                  });
                                  setShowEditForm(true);
                                  setShowAddForm(false);
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {/* Bouton Supprimer : Affiché si permission carburant.supprimer */}
                            {hasPermission("Carburant", "supprimer") && (
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="p-1 text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarburantContent;