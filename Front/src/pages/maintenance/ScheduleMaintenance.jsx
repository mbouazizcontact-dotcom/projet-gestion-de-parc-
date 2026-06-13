import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { EllipsisVerticalIcon, PlusIcon } from "@heroicons/react/24/solid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "../../Components/axios/axiosConfig";
import usePermissions from "../../hooks/usePermissions";
import { DragDropContext, Droppable, Draggable} from "@hello-pangea/dnd";
const MySwal = withReactContent(Swal);

const ScheduleMaintenance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ViewAll = location.pathname === "/ScheduleMaintenance";
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
    hasPermission,
  } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [columnPages, setColumnPages] = useState({
    Backlog: 1,
    "À faire": 1,
    "En cours": 1,
    Vérification: 1,
    Terminée: 1
  });
  const [itemsPerColumn, setItemsPerColumn] = useState(5);
  const [maintenances, setMaintenances] = useState([]);
  const [filteredMaintenances, setFilteredMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [filteredMechanics, setFilteredMechanics] = useState([]);
  const [garages, setGarages] = useState([]);
  const [selectedGarageFilter, setSelectedGarageFilter] = useState("");
  const [selectedMechanicFilter, setSelectedMechanicFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [viewMode, setViewMode] = useState("Tableau");
  const [eisenhowerFilter, setEisenhowerFilter] = useState("Tous");
  const [selectedMaintenance, setSelectedMaintenance] = useState({
    vehicule: null,
    typeMaintenance: "",
    typeIntervention: "",
    datePrevue: new Date().toISOString().split("T")[0],
    dateReservation: new Date().toISOString().split("T")[0],
    notes: "",
    kilometrage: "",
    mechanic: "",
    garage: "",
    _id: "",
    alertId: null,
    urgence: false,
    importance: false,
    statut: "Backlog",
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const vehicleInputRef = useRef(null);
  const menuRef = useRef(null);
  const partsPerPage = ViewAll ? 5 : 5;
  useEffect(() => {
    if (eisenhowerFilter !== "Tous") {
      const filtered = maintenances.filter(
        (m) => getEisenhowerQuadrant(m) === eisenhowerFilter
      );
      setFilteredMaintenances(filtered);
    } else {
      setFilteredMaintenances(maintenances);
    }
  }, [eisenhowerFilter, maintenances]);
  


  useEffect(() => {
    if (location.state && !showAddForm && !showEditForm) {
      const {
        vehicleId,
        vehicleName,
        maintenanceTypeId,
        typeIntervention,
        description,
        currentKm,
        nextDueKm,
        alertId,
        urgence,
        importance,
      } = location.state;

      if (vehicleId && typeIntervention) {
        setSelectedMaintenance({
          vehicule: vehicleId,
          typeMaintenance: maintenanceTypeId || "",
          typeIntervention,
          datePrevue: new Date().toISOString().split("T")[0],
          dateReservation: new Date().toISOString().split("T")[0],
          notes:
            description ||
            `Maintenance Backlog pour ${typeIntervention} à ${currentKm} km (prochain dû à ${nextDueKm} km).`,
          kilometrage: currentKm ? currentKm.toString() : "",
          mechanic: "",
          garage: "",
          _id: "",
          alertId: alertId || null,
          urgence: urgence || false,
          importance: importance || false,
          statut: "Backlog",
        });

        setVehicleSearch(vehicleName || "");
        setSelectedVehicle({
          _id: vehicleId,
          marque: vehicleName?.split(" ")[0] || "",
          modele: vehicleName?.split(" ")[1]?.replace(/^\((.*)\)$/, "$1") || "",
          immatriculation: vehicleName?.match(/\((.*?)\)/)?.[1] || "",
        });

        setShowAddForm(true);
        setShowEditForm(false);
      }
    }
  }, [location.state, showAddForm, showEditForm]);

  useEffect(() => {
    if (permissionsLoading || !hasPermission("maintenance", "lire")) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await Promise.all([
          fetchMaintenances(),
          fetchVehicles(),
          fetchMaintenanceTypes(),
          fetchMechanics(selectedMaintenance.garage),
          fetchGarages(),
        ]);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Impossible de charger les données. Veuillez réessayer plus tard.";
        console.error("Erreur lors du chargement des données:", {
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

    fetchData();
    const handleRefreshMaintenances = () => fetchMaintenances();
    window.addEventListener("refreshMaintenances", handleRefreshMaintenances);

    return () => {
      window.removeEventListener(
        "refreshMaintenances",
        handleRefreshMaintenances
      );
    };
  }, [permissionsLoading, hasPermission]);

  useEffect(() => {
    if (showAddForm || showEditForm) {
      fetchMechanics(selectedMaintenance.garage).then(() => {
        if (
          selectedMaintenance.mechanic &&
          !mechanics.some((m) => m._id === selectedMaintenance.mechanic)
        ) {
          setSelectedMaintenance({
            ...selectedMaintenance,
            mechanic: "",
          });
         
        }
      });
    }
  }, [selectedMaintenance.garage, showAddForm, showEditForm]);

  // Filter mechanics and maintenances based on selected garage and mechanic
  useEffect(() => {
    // Filter mechanics for dropdown
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

    // Filter maintenances
    let filtered = maintenances;

    if (selectedGarageFilter) {
      filtered = filtered.filter(
        (m) => m.garage?._id === selectedGarageFilter
      );
    }

    if (selectedMechanicFilter) {
      filtered = filtered.filter(
        (m) => m.mechanic?._id === selectedMechanicFilter
      );
    }

    if (searchQuery.trim()) {
      const lowerSearch = searchQuery.toLowerCase();
      filtered = filtered.filter((maintenance) =>
        [
          maintenance.vehicule?.marque,
          maintenance.vehicule?.modele,
          maintenance.vehicule?.immatriculation,
          maintenance.typeMaintenance?.nom,
          maintenance.typeMaintenance?.type_intervention,
          `${maintenance.mechanic?.nom || ""} ${maintenance.mechanic?.prenom || ""}`,
          maintenance.garage?.nom,
        ].some(
          (field) =>
            field && field.toLowerCase().includes(lowerSearch)
        )
      );
    }

    setFilteredMaintenances(filtered);
    
    // Réinitialiser les pages de colonnes lors d'un changement de filtrage
    setColumnPages({
      Backlog: 1,
      "À faire": 1,
      "En cours": 1,
      Vérification: 1,
      Terminée: 1
    });
  }, [selectedGarageFilter, selectedMechanicFilter, searchQuery, maintenances, mechanics]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        vehicleInputRef.current &&
        !vehicleInputRef.current.contains(event.target)
      ) {
        setShowVehicleDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
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
        "http://localhost:5000/api/maintenance/maintenances"
      );
      setMaintenances(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des maintenances:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.error("Erreur lors de la récupération des véhicules:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des véhicules"
      );
    }
  };

  const fetchMaintenanceTypes = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/maintenance/types"
      );
      setMaintenanceTypes(response.data);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des types de maintenance:",
        {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        }
      );
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des types de maintenance"
      );
    }
  };

  const fetchMechanics = async (garageId = "") => {
    try {
      const query = garageId
        ? `?statut=Disponible&garage=${garageId}`
        : "?statut=Disponible";
      const response = await axios.get(
        `http://localhost:5000/api/mecaniciens${query}`
      );
      setMechanics(response.data);
      if (!garageId) {
        setFilteredMechanics(response.data); // Update filtered mechanics for no garage
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des mécaniciens:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.error("Erreur lors de la récupération des garages:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      toast.error("Impossible de charger les garages.");
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des garages"
      );
    }
  };

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

  const handleAddMaintenance = () => {
    if (!hasPermission("maintenance", "creer")) {
      toast.error("Vous n'avez pas la permission de créer une maintenance.");
      return;
    }
    setShowAddForm(true);
    setShowEditForm(false);
    setSelectedMaintenance({
      vehicule: null,
      typeMaintenance: "",
      typeIntervention: "",
      datePrevue: new Date().toISOString().split("T")[0],
      dateReservation: new Date().toISOString().split("T")[0],
      notes: "",
      kilometrage: "",
      mechanic: "",
      garage: "",
      _id: "",
      alertId: null,
    });
    setSelectedVehicle(null);
    setVehicleSearch("");
    setShowVehicleDropdown(false);
    fetchMechanics(); // Fetch all available mechanics
  };

  const handleEditMaintenance = (maintenance) => {
    if (!hasPermission("maintenance", "modifier")) {
      toast.error("Vous n'avez pas la permission de modifier une maintenance.");
      return;
    }
    const newMaintenance = {
      vehicule: maintenance.vehicule?._id || null,
      typeMaintenance: maintenance.typeMaintenance?._id || "",
      typeIntervention: maintenance.typeMaintenance?.type_intervention || "",
      datePrevue: maintenance.datePrevue
        ? new Date(maintenance.datePrevue).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      dateReservation: maintenance.dateReservation
        ? new Date(maintenance.dateReservation).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: maintenance.notes || "",
      kilometrage: maintenance.kilometrage
        ? maintenance.kilometrage.toString()
        : "",
      mechanic: maintenance.mechanic?._id || "",
      garage: maintenance.garage?._id || "",
      _id: maintenance._id,
      alertId: null,
      urgence: maintenance.urgence === true,
      importance: maintenance.importance === true,
    };
    setSelectedMaintenance(newMaintenance);
    setSelectedVehicle(maintenance.vehicule);
    setVehicleSearch(
      maintenance.vehicule
        ? `${maintenance.vehicule.marque} ${maintenance.vehicule.modele} (${maintenance.vehicule.immatriculation})`
        : ""
    );
    fetchMechanics(newMaintenance.garage); // Fetch mechanics for the selected garage
    setShowEditForm(true);
    setShowAddForm(false);
    setOpenMenuId(null);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedMaintenance({
      vehicule: null,
      typeMaintenance: "",
      typeIntervention: "",
      datePrevue: new Date().toISOString().split("T")[0],
      dateReservation: new Date().toISOString().split("T")[0],
      notes: "",
      kilometrage: "",
      mechanic: "",
      garage: "",
      _id: "",
      alertId: null,
    });
    setSelectedVehicle(null);
    setVehicleSearch("");
    setShowVehicleDropdown(false);
    fetchMechanics(); // Reset to all available mechanics
    navigate(location.pathname, { replace: true, state: {} });
  };

  const validateMaintenanceData = () => {
    if (!selectedMaintenance.vehicule) {
      toast.error("Le véhicule est requis.");
      return false;
    }
    if (!selectedMaintenance.typeIntervention) {
      toast.error("Le type d'intervention est requis.");
      return false;
    }
    if (!selectedMaintenance.typeMaintenance) {
      toast.error("Le nom d'intervention est requis.");
      return false;
    }
    if (!selectedMaintenance.datePrevue) {
      toast.error("La date prévue est requise.");
      return false;
    }
    if (!selectedMaintenance.dateReservation) {
      toast.error("La date de réservation est requise.");
      return false;
    }
    if (
      !selectedMaintenance.kilometrage ||
      isNaN(selectedMaintenance.kilometrage) ||
      Number(selectedMaintenance.kilometrage) < 0
    ) {
      toast.error("Un kilométrage valide est requis.");
      return false;
    }
    return true;
  };

  const createMaintenance = async () => {
    if (!validateMaintenanceData()) return;

    if (!hasPermission("maintenance", "creer")) {
      toast.error("Vous n'avez pas la permission de créer une maintenance.");
      return;
    }

    const maintenanceType = maintenanceTypes.find(
      (type) => type._id === selectedMaintenance.typeMaintenance
    );
    const vehicle =
      vehicles.find((v) => v._id === selectedMaintenance.vehicule) ||
      selectedVehicle;
    const mechanic = mechanics.find(
      (m) => m._id === selectedMaintenance.mechanic
    );
    const garage = garages.find((g) => g._id === selectedMaintenance.garage);

    const result = await MySwal.fire({
      title: "Confirmer la création",
      text: `Voulez-vous vraiment programmer l'intervention ${
        maintenanceType?.nom || "N/A"
      } (${maintenanceType?.type_intervention || "N/A"}) pour ${
        vehicle?.marque || ""
      } ${vehicle?.modele || ""} (${
        vehicle?.immatriculation || ""
      }) prévue le ${new Date(
        selectedMaintenance.datePrevue
      ).toLocaleDateString()} avec ${selectedMaintenance.kilometrage} km${
        mechanic ? `, assignée à ${mechanic.nom} ${mechanic.prenom}` : ""
      }${garage ? ` au garage ${garage.nom}` : ""} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, créer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;
    const status = getEisenhowerQuadrant(selectedMaintenance) === "Éliminer/Reporter" 
    || getEisenhowerQuadrant(selectedMaintenance) === "Planifier" ? "Backlog" : "À faire";

    try {
      setIsLoading(true);
      setError(null);
      const data = {
        vehicule: selectedMaintenance.vehicule,
        typeMaintenance: selectedMaintenance.typeMaintenance,
        datePrevue: selectedMaintenance.datePrevue,
        dateReservation: selectedMaintenance.dateReservation,
        statut: status,
        notes: selectedMaintenance.notes,
        kilometrage: Number(selectedMaintenance.kilometrage),
        mechanic: selectedMaintenance.mechanic || null,
        garage: selectedMaintenance.garage || null,
        urgence: selectedMaintenance.urgence,
        importance: selectedMaintenance.importance,
      };
      const response = await axios.post(
        "http://localhost:5000/api/maintenance/maintenances",
        data
      );
     

      // Update alert status if maintenance comes from an alert
      if (selectedMaintenance.alertId) {
        try {
          await axios.put(
            `http://localhost:5000/api/alertes/${selectedMaintenance.alertId}/status`,
            { status: "Résolue", maintenanceScheduled: true },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
         
        } catch (alertError) {
          console.error("Erreur lors de la mise à jour de l'alerte:", {
            status: alertError.response?.status,
            data: alertError.response?.data,
            message: alertError.message,
          });
          toast.error("Erreur lors de la mise à jour de l'état de l'alerte.");
          throw alertError;
        }
      }

      // Show success notification and close form only on OK
      await Swal.fire({
        title: "Maintenance créée",
        text: "L'intervention a été programmée avec succès. L'état du véhicule et du mécanicien ont été mis à jour.",
        icon: "success",
        timer: 2000,
        showConfirmButton: true,
      }).then(() => {
        handleCancelForm();
        setSearchQuery("");
      });

      // Refresh data
      await Promise.all([
        fetchMaintenances(),
        fetchMechanics(),
        fetchVehicles(),
      ]);
      setCurrentPage(1);
      window.dispatchEvent(new Event("refreshVehicles"));
      window.dispatchEvent(new Event("maintenanceScheduled"));
    } catch (error) {
      console.error("Erreur lors de la création de l'intervention:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else if (error.response?.status === 409) {
        toast.error(
          "Le mécanicien sélectionné est déjà occupé. Veuillez en choisir un autre."
        );
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "Une erreur est survenue lors de la création de l'intervention.";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateMaintenance = async (selectedMaintenance) => {
    if (!validateMaintenanceData()) return;
  
    if (!hasPermission("maintenance", "modifier")) {
      toast.error("Vous n'avez pas la permission de modifier une maintenance.");
      return;
    }
  
    const maintenanceType = maintenanceTypes.find(
      (type) => type._id === selectedMaintenance.typeMaintenance
    );
    const vehicle =
      vehicles.find((v) => v._id === selectedMaintenance.vehicule) ||
      selectedVehicle;
    const mechanic = mechanics.find(
      (m) => m._id === selectedMaintenance.mechanic
    );
    const garage = garages.find((g) => g._id === selectedMaintenance.garage);
  
    const result = await MySwal.fire({
      title: "Confirmer la modification",
      text: `Voulez-vous vraiment modifier l'intervention ${
        maintenanceType?.nom || "N/A"
      } (${maintenanceType?.type_intervention || "N/A"}) pour ${
        vehicle?.marque || ""
      } ${vehicle?.modele || ""} (${
        vehicle?.immatriculation || ""
      }) prévue le ${new Date(
        selectedMaintenance.datePrevue
      ).toLocaleDateString()} avec ${selectedMaintenance.kilometrage} km${
        mechanic ? `, assignée à ${mechanic.nom} ${mechanic.prenom}` : ""
      }${garage ? ` au garage ${garage.nom}` : ""} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, modifier",
      cancelButtonText: "Annuler",
    });
  
    if (!result.isConfirmed) return;
  
    try {
      setIsLoading(true);
      setError(null);
      const data = {
        vehicule: selectedMaintenance.vehicule,
        typeMaintenance: selectedMaintenance.typeMaintenance,
        datePrevue: selectedMaintenance.datePrevue,
        dateReservation: selectedMaintenance.dateReservation,
        statut: selectedMaintenance.statut,
        notes: selectedMaintenance.notes,
        kilometrage: Number(selectedMaintenance.kilometrage),
        mechanic: selectedMaintenance.mechanic || null,
        garage: selectedMaintenance.garage || null,
        urgence: selectedMaintenance.urgence,
        importance: selectedMaintenance.importance,
      };
      
      // Send update request
      const response = await axios.put(
        `http://localhost:5000/api/maintenance/maintenances/${selectedMaintenance._id}`,
        data
      );
    
      // Temporary workaround: Update local state immediately
      setMaintenances((prev) =>
        prev.map((m) =>
          m._id === selectedMaintenance._id
            ? {
                ...m,
                ...data,
                vehicule: vehicles.find((v) => v._id === data.vehicule) || m.vehicule,
                typeMaintenance:
                  maintenanceTypes.find((t) => t._id === data.typeMaintenance) ||
                  m.typeMaintenance,
                mechanic: mechanics.find((m) => m._id === data.mechanic) || null,
                garage: garages.find((g) => g._id === data.garage) || null,
              }
            : m
        )
      );
  
      // Show success notification and close form
      await Swal.fire({
        title: "Modification confirmée",
        text: "L'intervention a été modifiée avec succès. L'état du véhicule et du mécanicien ont été mis à jour.",
        icon: "success",
        showConfirmButton: true,
      }).then(() => {
        handleCancelForm();
        setSearchQuery("");
      });
  
      // Refresh data from backend
      await Promise.all([
        fetchMaintenances(),
        fetchMechanics(),
        fetchVehicles(),
      ]);
      setCurrentPage(1);
      window.dispatchEvent(new Event("refreshVehicles"));
      window.dispatchEvent(new Event("maintenanceScheduled"));
    } catch (error) {
      console.error("Erreur lors de la modification de l'intervention:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else if (error.response?.status === 409) {
        toast.error(
          "Le mécanicien sélectionné est déjà occupé. Veuillez en choisir un autre."
        );
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "Une erreur est survenue lors de la modification de l'intervention.";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMaintenance = async (id, typeNom, vehicle) => {
    if (!hasPermission("MaintenanceReparations", "supprimer")) {
      toast.error(
        "Vous n'avez pas la permission de supprimer une maintenance."
      );
      return;
    }

    // Ajout de logs de débogage
    
    if (!id) {
      console.error("ID de maintenance manquant");
      toast.error("Impossible de supprimer: ID de maintenance manquant");
      return;
    }

    // Récupérer les informations de maintenance
    const maintenance = maintenances.find((m) => m._id === id);
    
    if (!maintenance) {
      console.error("Maintenance not found with ID:", id);
      toast.error("Maintenance introuvable");
      return;
    }

    if (!vehicle) {
      console.error("Vehicle information is missing", { id, typeNom });
      // Essayons de récupérer le véhicule à partir de l'objet maintenance
      if (!maintenance.vehicule) {
        toast.error("Impossible de supprimer: Informations du véhicule manquantes");
        return;
      }
      vehicle = maintenance.vehicule;
    }
    
    const typeIntervention =
      maintenance?.typeMaintenance?.type_intervention || "N/A";
    const mechanic = maintenance?.mechanic;
    const garage = maintenance?.garage;

    const result = await MySwal.fire({
      title: "Confirmer la suppression",
      text: `Voulez-vous vraiment supprimer l'intervention ${typeNom} (${typeIntervention}) pour ${
        vehicle.marque
      } ${vehicle.modele} (${vehicle.immatriculation})${
        mechanic ? ` assignée à ${mechanic.nom} ${mechanic.prenom}` : ""
      }${garage ? ` au garage ${garage.nom}` : ""} ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      setError(null);

      await axios.delete(
        `http://localhost:5000/api/maintenance/maintenances/${id}`
      );

      await Swal.fire({
        title: "Suppression confirmée",
        text: "L'intervention a été supprimée avec succès. L'état du véhicule et du mécanicien ont été mis à jour.",
        icon: "success",
      });

      setSearchQuery("");
      await Promise.all([
        fetchMaintenances(),
        fetchMechanics(),
        fetchVehicles(),
      ]);
      setCurrentPage(1);
      window.dispatchEvent(new Event("refreshVehicles"));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'intervention:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "Une erreur est survenue lors de la suppression de l'intervention.";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startMaintenance = async (maintenance) => {
    if (
      !hasPermission("MaintenanceReparations", "changer_statut") &&
      !hasPermission("MaintenanceReparations", "modifier")
    ) {
      toast.error("Vous n'avez pas la permission de commencer une maintenance.");
      return;
    }
  
    const result = await MySwal.fire({
      title: "Confirmer le démarrage",
      text: `Voulez-vous commencer l'intervention ${
        maintenance.typeMaintenance?.nom || "N/A"
      } (${maintenance.typeMaintenance?.type_intervention || "N/A"}) pour ${
        maintenance.vehicule?.marque || ""
      } ${maintenance.vehicule?.modele || ""} (${
        maintenance.vehicule?.immatriculation || ""
      })${
        maintenance.mechanic
          ? ` assignée à ${maintenance.mechanic.nom} ${maintenance.mechanic.prenom}`
          : ""
      }${maintenance.garage ? ` au garage ${maintenance.garage.nom}` : ""} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, commencer",
      cancelButtonText: "Annuler",
    });
  
    if (!result.isConfirmed) return;
  
    try {
      setIsLoading(true);
      setError(null);
  
      const data = {
        vehicule: maintenance.vehicule?._id,
        typeMaintenance: maintenance.typeMaintenance?._id,
        datePrevue: maintenance.datePrevue
          ? new Date(maintenance.datePrevue).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        dateReservation: maintenance.dateReservation
          ? new Date(maintenance.dateReservation).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        statut: "En cours",
        notes: maintenance.notes || "",
        kilometrage: maintenance.kilometrage || 0,
        mechanic: maintenance.mechanic?._id || null,
        garage: maintenance.garage?._id || null,
      };
  
      const response = await axios.put(
        `http://localhost:5000/api/maintenance/maintenances/${maintenance._id}`,
        data
      );
     
  
      await Swal.fire({
        title: "Maintenance commencée",
        text: "L'intervention a été marquée comme 'En cours'. L'état du véhicule et du mécanicien ont été mis à jour.",
        icon: "success",
      });
  
      // Rafraîchir les données
      await Promise.all([
        fetchMaintenances(),
        fetchMechanics(),
        fetchVehicles(),
      ]);
      setCurrentPage(1);
      window.dispatchEvent(new Event("refreshVehicles"));
      setOpenMenuId(null);
  
      // Préparer les données pour la navigation
      const navigationData = {
        maintenanceId: maintenance._id,
        vehicle: {
          _id: maintenance.vehicule?._id || "",
          marque: maintenance.vehicule?.marque || "",
          modele: maintenance.vehicule?.modele || "",
          immatriculation: maintenance.vehicule?.immatriculation || "",
          kilometrage: maintenance.kilometrage || 0,
        },
        mechanic: maintenance.mechanic
          ? {
              _id: maintenance.mechanic._id,
              nom: maintenance.mechanic.nom,
              prenom: maintenance.mechanic.prenom,
            }
          : null,
        garage: maintenance.garage
          ? {
              _id: maintenance.garage._id,
              nom: maintenance.garage.nom,
              adresse: maintenance.garage.adresse,
            }
          : null,
        typeMaintenance: maintenance.typeMaintenance
          ? {
              _id: maintenance.typeMaintenance._id,
              nom: maintenance.typeMaintenance.nom,
              type_intervention: maintenance.typeMaintenance.type_intervention,
            }
          : null,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
      };
  
  
      // Navigation vers /ficheReceptionAtelier
      navigate("/ficheReceptionAtelier", {
        state: navigationData,
      });
    } catch (error) {
      console.error("Erreur lors du démarrage de l'intervention:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else if (error.response?.status === 409) {
        toast.error(
          "Le mécanicien assigné est déjà occupé. Veuillez en choisir un autre."
        );
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "Une erreur est survenue lors du démarrage de l'intervention.";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
 const completeMaintenance = async (id, typeNom, vehicle) => {
  if (
    !hasPermission("MaintenanceReparations", "changer_statut") &&
    !hasPermission("MaintenanceReparations", "modifier")
  ) {
    toast.error("Vous n'avez pas la permission de terminer une maintenance.");
    return;
  }

  const maintenance = maintenances.find((m) => m._id === id);
  if (!maintenance) {
    toast.error("Maintenance introuvable.");
    console.error("Maintenance not found:", id);
    return;
  }

  // Check if the maintenance is in an invalid status for completion
  if (maintenance.statut === "À faire" || maintenance.statut === "Backlog") {
    toast.error("Une maintenance ne peut être terminée que si elle est en cours ou en vérification.");
    return;
  }

  // Ensure the maintenance is in "En cours" or "Vérification" status
  if (maintenance.statut !== "En cours" && maintenance.statut !== "Vérification") {
    toast.error("Une maintenance ne peut être terminée que si elle est en cours ou en vérification.");
    return;
  }

  const typeIntervention = maintenance?.typeMaintenance?.type_intervention || "N/A";
  const mechanic = maintenance?.mechanic;
  const garage = maintenance?.garage;

  const result = await MySwal.fire({
    title: "Confirmer la finalisation",
    text: `Voulez-vous terminer l'intervention ${typeNom} (${typeIntervention}) pour ${
      vehicle.marque
    } ${vehicle.modele} (${vehicle.immatriculation})${
      mechanic ? ` assignée à ${mechanic.nom} ${mechanic.prenom}` : ""
    }${garage ? ` au garage ${garage.nom}` : ""} ?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Oui, terminer",
    cancelButtonText: "Annuler",
  });

  if (!result.isConfirmed) return;

  try {
    setIsLoading(true);
    setError(null);

    const response = await axios.put(
      `http://localhost:5000/api/maintenance/maintenances/${id}`,
      {
        statut: "Terminée",
      }
    );

    await Swal.fire({
      title: "Maintenance terminée",
      text: "L'intervention a été marquée comme 'Terminée'. L'état du véhicule et du mécanicien ont été mis à jour.",
      icon: "success",
    });

    // Refresh data
    await Promise.all([fetchMaintenances(), fetchMechanics(), fetchVehicles()]);
    setCurrentPage(1);
    window.dispatchEvent(new Event("refreshVehicles"));
    setOpenMenuId(null);

    // Prepare navigation data
    const navigationData = {
      maintenanceId: id,
      vehicle: {
        _id: vehicle._id || "",
        marque: vehicle.marque || "",
        modele: vehicle.modele || "",
        immatriculation: vehicle.immatriculation || "",
        kilometrage: maintenance.kilometrage || 0,
      },
      mechanic: mechanic
        ? {
            _id: mechanic._id,
            nom: mechanic.nom,
            prenom: mechanic.prenom,
          }
        : null,
      garage: garage
        ? {
            _id: garage._id,
            nom: garage.nom,
            adresse: garage.adresse,
          }
        : null,
      typeMaintenance: maintenance.typeMaintenance
        ? {
            _id: maintenance.typeMaintenance._id,
            nom: maintenance.typeMaintenance.nom,
            type_intervention: maintenance.typeMaintenance.type_intervention,
          }
        : null,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
    };

    // Navigate to /ficheIntervention
    navigate("/ficheIntervention", {
      state: navigationData,
    });
  } catch (error) {
    console.error("Erreur lors de la finalisation de l'intervention:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    if (error.response?.status === 401) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        "Une erreur est survenue lors de la finalisation de l'intervention.";
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    }
  } finally {
    setIsLoading(false);
  }
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
        return "text-blue-700 bg-white border border-blue-200 shadow-sm";
      case "Corrective":
        return "text-red-700 bg-white border border-red-200 shadow-sm";
      case "Conditionnelle":
        return "text-yellow-700 bg-white border border-yellow-200 shadow-sm";
      case "Périodique":
        return "text-green-700 bg-white border border-green-200 shadow-sm";
      case "Sécurité":
        return "text-orange-700 bg-white border border-orange-200 shadow-sm";
      default:
        return "text-gray-700 bg-white border border-gray-200 shadow-sm";
    }
  };

  const interventionTypes = [
    "Préventive",
    "Corrective",
    "Conditionnelle",
    "Périodique",
    "Sécurité",
  ];

  const filteredMaintenanceTypes = selectedMaintenance.typeIntervention
    ? maintenanceTypes.filter(
        (type) =>
          type.type_intervention === selectedMaintenance.typeIntervention
      )
    : maintenanceTypes;

    const renderAddForm = () => (
      <div className="p-2 bg-white shadow-lg rounded-lg max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Programmer une maintenance</h2>
        {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); createMaintenance(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div ref={vehicleInputRef}>
              <label className="block text-gray-700 text-sm font-bold mb-1">Véhicule <span className="text-red-500">*</span></label>
              <input type="text" value={vehicleSearch} onChange={(e) => { setVehicleSearch(e.target.value); setShowVehicleDropdown(true); }} onFocus={() => setShowVehicleDropdown(true)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rechercher un véhicule..." required />
              {showVehicleDropdown && <div className="absolute z-10 w-full max-w-md bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">{filteredVehicles.map((vehicle) => <div key={vehicle._id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedMaintenance({ ...selectedMaintenance, vehicule: vehicle._id, kilometrage: vehicle.kilometrage?.toString() || "" }); setSelectedVehicle(vehicle); setVehicleSearch(`${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`); setShowVehicleDropdown(false); }}>{vehicle.marque} {vehicle.modele} ({vehicle.immatriculation})</div>)}</div>}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Type d'intervention <span className="text-red-500">*</span></label>
              <select value={selectedMaintenance.typeIntervention} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, typeIntervention: e.target.value, typeMaintenance: "" })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Sélectionner un type</option>
                {["Préventive", "Corrective", "Conditionnelle", "Périodique", "Sécurité"].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Nom d'intervention <span className="text-red-500">*</span></label>
              <select value={selectedMaintenance.typeMaintenance} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, typeMaintenance: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={!selectedMaintenance.typeIntervention}>
                <option value="">Sélectionner un nom</option>
                {maintenanceTypes.filter((type) => type.type_intervention === selectedMaintenance.typeIntervention).map((type) => <option key={type._id} value={type._id}>{type.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Urgence</label>
              <select value={selectedMaintenance.urgence} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, urgence: e.target.value === "true" })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Importance</label>
              <select value={selectedMaintenance.importance} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, importance: e.target.value === "true" })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </select>
            </div>
            <div className="">
            <label className="block text-gray-700 text-sm font-bold mb-1">Quadrant</label>
              <input type="text" className="flex text-gray-700 -mb-5 text-center border bg-gray-200 border-gray-500 p-2.5 w-full rounded-xl text-sm font-bold "  readOnly value={
                selectedMaintenance.importance && selectedMaintenance.urgence ? " Faire immédiatement" :
                !selectedMaintenance.importance && !selectedMaintenance.urgence ? "Éliminer ou reporter" : 
                !selectedMaintenance.importance && selectedMaintenance.urgence ? "Déléguer" : selectedMaintenance.importance && !selectedMaintenance.urgence ? "Planifier" : ""
                }/>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Garage assigné</label>
              <select value={selectedMaintenance.garage} onChange={(e) => { setSelectedMaintenance({ ...selectedMaintenance, garage: e.target.value, mechanic: "" }); fetchMechanics(e.target.value); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Aucun garage</option>
                {garages.map((garage) => <option key={garage._id} value={garage._id}>{garage.nom} ({garage.adresse})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Mécanicien assigné</label>
              <select value={selectedMaintenance.mechanic} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, mechanic: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Aucun mécanicien</option>
                {mechanics.map((mechanic) => <option key={mechanic._id} value={mechanic._id}>{mechanic.nom} {mechanic.prenom} (Disponible)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Date prévue <span className="text-red-500">*</span></label>
              <input type="date" value={selectedMaintenance.datePrevue} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, datePrevue: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Date de réservation <span className="text-red-500">*</span></label>
              <input type="date" value={selectedMaintenance.dateReservation} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" required />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Kilométrage (km) <span className="text-red-500">*</span></label>
              <input type="number" value={selectedMaintenance.kilometrage} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, kilometrage: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Entrez le kilométrage actuel" required min="0" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-1">Notes</label>
              <textarea value={selectedMaintenance.notes} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Entrez des notes supplémentaires..." rows="4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 mt-6">
            <button type="submit" className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`} disabled={isLoading}>{isLoading ? "Traitement..." : "Créer"}</button>
            <button type="button" onClick={handleCancelForm} className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 w-full" disabled={isLoading}>Annuler</button>
          </div>
        </form>
      </div>
    );

    const renderEditForm = () => (
      <div className="p-6 bg-white shadow-lg rounded-lg max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Modifier une maintenance</h2>
        {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); updateMaintenance(selectedMaintenance); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div ref={vehicleInputRef}>
              <label className="block text-gray-700 text-sm font-bold mb-1">Véhicule <span className="text-red-500">*</span></label>
              <input type="text" value={vehicleSearch} onChange={(e) => { setVehicleSearch(e.target.value); setShowVehicleDropdown(true); }} onFocus={() => setShowVehicleDropdown(true)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rechercher un véhicule..." required />
              {showVehicleDropdown && <div className="absolute z-10 w-full max-w-md bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">{filteredVehicles.map((vehicle) => <div key={vehicle._id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedMaintenance({ ...selectedMaintenance, vehicule: vehicle._id, kilometrage: vehicle.kilometrage?.toString() || "" }); setSelectedVehicle(vehicle); setVehicleSearch(`${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`); setShowVehicleDropdown(false); }}>{vehicle.marque} {vehicle.modele} ({vehicle.immatriculation})</div>)}</div>}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Type d'intervention <span className="text-red-500">*</span></label>
              <select value={selectedMaintenance.typeIntervention} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, typeIntervention: e.target.value, typeMaintenance: "" })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Sélectionner un type</option>
                {["Préventive", "Corrective", "Conditionnelle", "Périodique", "Sécurité"].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Nom d'intervention <span className="text-red-500">*</span></label>
              <select value={selectedMaintenance.typeMaintenance} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, typeMaintenance: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={!selectedMaintenance.typeIntervention}>
                <option value="">Sélectionner un nom</option>
                {maintenanceTypes.filter((type) => type.type_intervention === selectedMaintenance.typeIntervention).map((type) => <option key={type._id} value={type._id}>{type.nom}</option>)}
              </select>
            </div>
            <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Urgence</label>
          <select value={selectedMaintenance.urgence} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, urgence: e.target.value === "true" })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="false">Non</option>
            <option value="true">Oui</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Importance</label>
          <select value={selectedMaintenance.importance} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, importance: e.target.value === "true" })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="false">Non</option>
            <option value="true">Oui</option>
          </select>
        </div>
            <div className="">
            <label className="block text-gray-700 text-sm font-bold mb-1">Quadrant</label>
              <input type="text" className="flex text-gray-700 -mb-5 text-center border bg-gray-200 border-gray-500 p-2.5 w-full rounded-xl text-sm font-bold "  readOnly value={
                selectedMaintenance.importance && selectedMaintenance.urgence ? " Faire immédiatement" :
                !selectedMaintenance.importance && !selectedMaintenance.urgence ? "Éliminer ou reporter" : 
                !selectedMaintenance.importance && selectedMaintenance.urgence ? "Déléguer" : selectedMaintenance.importance && !selectedMaintenance.urgence ? "Planifier" : ""
                }/>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Garage assigné</label>
              <select value={selectedMaintenance.garage} onChange={(e) => { setSelectedMaintenance({ ...selectedMaintenance, garage: e.target.value, mechanic: "" }); fetchMechanics(e.target.value); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Aucun garage</option>
                {garages.map((garage) => <option key={garage._id} value={garage._id}>{garage.nom} ({garage.adresse})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Mécanicien assigné</label>
              <select value={selectedMaintenance.mechanic} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, mechanic: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Aucun mécanicien</option>
                {mechanics.map((mechanic) => <option key={mechanic._id} value={mechanic._id}>{mechanic.nom} {mechanic.prenom} (Disponible)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Date prévue <span className="text-red-500">*</span></label>
              <input type="date" value={selectedMaintenance.datePrevue} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, datePrevue: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Date de réservation <span className="text-red-500">*</span></label>
              <input type="date" value={selectedMaintenance.dateReservation} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" required />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Kilométrage (km) <span className="text-red-500">*</span></label>
              <input type="number" value={selectedMaintenance.kilometrage} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, kilometrage: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Entrez le kilométrage actuel" required min="0" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-1">Notes</label>
              <textarea value={selectedMaintenance.notes} onChange={(e) => setSelectedMaintenance({ ...selectedMaintenance, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Entrez des notes supplémentaires..." rows="4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 mt-6">
            <button type="submit" className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`} disabled={isLoading}>{isLoading ? "Traitement..." : "Modifier"}</button>
            <button type="button" onClick={handleCancelForm} className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 w-full" disabled={isLoading}>Annuler</button>
          </div>
        </form>
      </div>
    );
const onDragEnd = async (result) => {
  if (!result.destination) return;

  const { source, destination } = result;
  const sourceIndex = parseInt(source.droppableId);
  const destIndex = parseInt(destination.droppableId);
  const newStatus = ["Backlog", "À faire", "En cours", "Vérification", "Terminée"][destIndex];
  const sourceStatus = ["Backlog", "À faire", "En cours", "Vérification", "Terminée"][sourceIndex];

  // Prevent moving from "Terminée" to any other status
  if (sourceIndex === 4) {
    toast.error(`Vous ne pouvez pas déplacer une maintenance terminée vers un autre statut précédent.`, {
      autoClose: 3000,
    });
    return;
  }

  // Prevent moving from "En cours" or "Vérification" to "Backlog" or "À faire" (except Vérification to En cours)
  if ((sourceIndex === 2 || sourceIndex === 3) && (destIndex === 0 || destIndex === 1) && !(sourceIndex === 3 && destIndex === 2)) {
    toast.error(`Vous ne pouvez pas déplacer de "${sourceStatus}" à "${newStatus}".`, {
      autoClose: 3000,
    });
    return;
  }

  // Prevent moving if source and destination are the same
  if (sourceIndex === destIndex) {
    return;
  }

  const newMaintenances = Array.from(filteredMaintenances);
  const movedMaintenance = newMaintenances.find((m) => m._id === result.draggableId);

  // Show confirmation alert for transitions except Backlog to À faire
  let shouldConfirm = true;
  if (sourceIndex === 0 && destIndex === 1) { // Backlog to À faire
    shouldConfirm = false;
  } else if ((sourceIndex === 0 || sourceIndex === 1) && destIndex === 2) { // Backlog or À faire to En cours
    shouldConfirm = true;
  } else if (sourceIndex === 1 && destIndex === 0) { // À faire to Backlog
    shouldConfirm = true;
  } else if (sourceIndex === 3 && destIndex === 2) { // Vérification to En cours
    shouldConfirm = true; // Ajout de la confirmation pour Vérification to En cours
  }

  if (shouldConfirm) {
    const resultConfirmation = await MySwal.fire({
      title: `Confirmer le déplacement`,
      text: `Voulez-vous déplacer l'intervention "${movedMaintenance.typeMaintenance?.nom || 'N/A'}" pour ${movedMaintenance.vehicule?.marque || ''} ${movedMaintenance.vehicule?.modele || ''} (${movedMaintenance.vehicule?.immatriculation || ''}) vers "${newStatus}" ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, déplacer",
      cancelButtonText: "Annuler",
    });

    if (!resultConfirmation.isConfirmed) return;
  }

  // Update local state immediately
  movedMaintenance.statut = newStatus;
  setFilteredMaintenances(newMaintenances);

  try {
    const maintenanceId = movedMaintenance._id;
    const response = await axios.put(
      `http://localhost:5000/api/maintenance/maintenancesStatus/${maintenanceId}`,
      { statut: newStatus }
    );
    toast.success(`Maintenance déplacée vers ${newStatus}`);

    if (newStatus === "Terminée") {
      const navigationData = {
        maintenanceId,
        vehicle: movedMaintenance.vehicule || {},
        mechanic: movedMaintenance.mechanic || null,
        garage: movedMaintenance.garage || null,
        typeMaintenance: movedMaintenance.typeMaintenance || null,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
      };
      navigate("/ficheIntervention", { state: navigationData });
    } else if (newStatus === "En cours" && (sourceIndex === 0 || sourceIndex === 1 || sourceIndex === 3)) {
      const receptionData = {
        maintenanceId,
        vehicle: movedMaintenance.vehicule || {},
        mechanic: movedMaintenance.mechanic || null,
        garage: movedMaintenance.garage || null,
        typeMaintenance: movedMaintenance.typeMaintenance || null,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
      };
      navigate("/ficheReceptionAtelier", { state: receptionData });
    }

    await fetchMaintenances();
  } catch (error) {
    toast.error("Erreur lors du déplacement de la maintenance: " + (error.response?.data?.message || error.message));
    await fetchMaintenances();
  }
};

  const getEisenhowerQuadrant = (maintenance) => {
    if (maintenance.urgence && maintenance.importance) return "Faire immédiatement";
    if (!maintenance.urgence && maintenance.importance) return "Planifier";
    if (maintenance.urgence && !maintenance.importance) return "Déléguer";
    return "Éliminer/Reporter";
  };

  const renderKanbanView = () => {
    const columns = {
      Backlog: filteredMaintenances.filter((m) => m.statut === "Backlog"),
      "À faire": filteredMaintenances.filter((m) => m.statut === "À faire"),
      "En cours": filteredMaintenances.filter((m) => m.statut === "En cours"),
      Vérification: filteredMaintenances.filter((m) => m.statut === "Vérification"),
      Terminée: filteredMaintenances.filter((m) => m.statut === "Terminée"),
    };

    // Calculer les éléments à afficher pour chaque colonne en fonction de la pagination
    const paginatedColumns = {};
    Object.keys(columns).forEach(column => {
      const startIndex = (columnPages[column] - 1) * itemsPerColumn;
      const endIndex = startIndex + itemsPerColumn;
      paginatedColumns[column] = columns[column].slice(startIndex, endIndex);
    });

    return (
      <>
        <div className="mb-4 flex justify-end items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="itemsPerColumn" className="mr-2 text-sm font-medium text-gray-700">
              Cartes par colonne:
            </label>
            <select
              id="itemsPerColumn"
              value={itemsPerColumn}
              onChange={handleItemsPerColumnChange}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </div>
        </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4">
            {Object.keys(columns).map((column, index) => {
              const totalItems = columns[column].length;
              const totalPages = Math.ceil(totalItems / itemsPerColumn);
              const startItem = totalItems > 0 ? (columnPages[column] - 1) * itemsPerColumn + 1 : 0;
              const endItem = Math.min(startItem + itemsPerColumn - 1, totalItems);
              
              return (
            <Droppable droppableId={index.toString()} key={column}>
              {(provided) => (
                    <div className="bg-gray-100 p-4 rounded-lg w-80 flex-shrink-0 flex flex-col" {...provided.droppableProps} ref={provided.innerRef}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          {column}
                          <span className="ml-2 text-sm font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full">
                            {totalItems}
                          </span>
                        </h3>
                      </div>

                      {/* Indicateur de pagination */}
                      {totalItems > 0 && (
                        <div className="flex justify-center mb-3 text-xs text-gray-500">
                          Affichage {startItem}-{endItem} sur {totalItems}
                        </div>
                      )}
                      
                      <div className="space-y-4 flex-grow min-h-52">
                        {paginatedColumns[column].length > 0 ? (
                          paginatedColumns[column].map((maintenance, idx) => {
                      const quadrant = getEisenhowerQuadrant(maintenance);
                      return (
                        <Draggable key={maintenance._id} draggableId={maintenance._id} index={idx}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                                    className={`p-0 bg-white shadow-sm rounded-lg ${getQuadrantColor(quadrant)} hover:shadow-md transition-all duration-200 overflow-hidden`}
                                  >
                                    {/* En-tête de la carte avec info du véhicule */}
                                    <div className="p-3 pb-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a1 1 0 001-1v-1h5.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-6a1 1 0 00-.386-.77l-3-2.5A1 1 0 0016 3H3z" />
                                          </svg>
                                          <h4 className="font-medium text-gray-800 line-clamp-1">
                                {maintenance.vehicule?.marque} {maintenance.vehicule?.modele}
                              </h4>
                                        </div>
                                        {maintenance.vehicule?.immatriculation && (
                                          <span className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600 font-medium">
                                            {maintenance.vehicule.immatriculation}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Type de maintenance avec badge */}
                                      <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-medium text-gray-700 line-clamp-1 mr-1">
                                          {maintenance.typeMaintenance?.nom || "Maintenance sans nom"}
                                        </h3>
                                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getInterventionTypeStyles(maintenance.typeMaintenance?.type_intervention)}`}>
                                          {maintenance.typeMaintenance?.type_intervention || "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Informations détaillées */}
                                    <div className="grid grid-cols-2 gap-0 px-3 pb-2 text-xs">
                                      <div className="flex items-center text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="truncate">{new Date(maintenance.datePrevue).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="truncate">{quadrant.split('/')[0]}</span>
                                      </div>
                                      {maintenance.mechanic && (
                                        <div className="flex items-center col-span-2 mt-1 text-gray-500">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          <span className="truncate">{maintenance.mechanic.nom} {maintenance.mechanic.prenom}</span>
                                        </div>
                                      )}
                                      {maintenance.garage && (
                                        <div className="flex items-center col-span-2 mt-1 text-gray-500">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                          </svg>
                                          <span className="truncate">{maintenance.garage.nom}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="grid grid-cols-2 mt-1 border-t border-gray-100">
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleEditMaintenance(maintenance);
                                        }}
                                        className="py-2 px-2 text-center text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Modifier
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          deleteMaintenance(
                                            maintenance._id, 
                                            maintenance.typeMaintenance?.nom || "N/A", 
                                            maintenance.vehicule
                                          );
                                        }} 
                                        className="py-2 px-2 text-center text-xs font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100 flex items-center justify-center"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Supprimer
                                      </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                          })
                        ) : (
                          <div className="flex items-center justify-center h-20 text-gray-500 italic">
                            Aucune maintenance
                          </div>
                        )}
                    {provided.placeholder}
                  </div>
                      
                      {/* Contrôles de pagination améliorés */}
                      {totalPages > 1 && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <button 
                              onClick={() => handleColumnPrevPage(column)}
                              disabled={columnPages[column] === 1}
                              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                columnPages[column] === 1 
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              } transition-colors`}
                              title="Page précédente"
                            >
                              <span className="sr-only">Précédent</span>
                              &#8592;
                            </button>
                            
                            <span className="text-xs px-2 py-1 rounded-md bg-gray-200">
                              {columnPages[column]} / {totalPages}
                            </span>
                            
                            <button 
                              onClick={() => handleColumnNextPage(column)}
                              disabled={columnPages[column] === totalPages}
                              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                columnPages[column] === totalPages 
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              } transition-colors`}
                              title="Page suivante"
                            >
                              <span className="sr-only">Suivant</span>
                              &#8594;
                            </button>
                          </div>
                        </div>
                      )}
                </div>
              )}
            </Droppable>
              );
            })}
        </div>
      </DragDropContext>
      </>
    );
  };

  const getQuadrantColor = (quadrant) => {
    switch (quadrant) {
      case "Faire immédiatement": return "border-l-4 border-l-red-500";
      case "Planifier": return "border-l-4 border-l-blue-500";
      case "Déléguer": return "border-l-4 border-l-yellow-500";
      case "Éliminer/Reporter": return "border-l-4 border-l-gray-500";
      default: return "border-l-4 border-l-gray-500";
    }
  };

  const handleColumnNextPage = (column) => {
    setColumnPages(prev => {
      const totalItems = filteredMaintenances.filter(m => m.statut === column).length;
      const totalPages = Math.ceil(totalItems / itemsPerColumn);
      if (prev[column] < totalPages) {
        return { ...prev, [column]: prev[column] + 1 };
      }
      return prev;
    });
  };

  const handleColumnPrevPage = (column) => {
    setColumnPages(prev => {
      if (prev[column] > 1) {
        return { ...prev, [column]: prev[column] - 1 };
      }
      return prev;
    });
  };

  const handleItemsPerColumnChange = (e) => {
    const newItemsPerColumn = Number(e.target.value);
    setItemsPerColumn(newItemsPerColumn);
    // Réinitialiser les pages actuelles pour chaque colonne
    const resetPages = {};
    Object.keys(columnPages).forEach(column => {
      resetPages[column] = 1;
    });
    setColumnPages(resetPages);
  };

  if (permissionsLoading)
    return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (permissionsError)
    return (
      <div className="p-8 text-center text-red-600">{permissionsError}</div>
    );
  if (!hasPermission("MaintenanceReparations", "lire")) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n&apos;avez pas la permission de voir la liste des maintenances.
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
            <div className="pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Liste des maintenances programmées
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-200">
                    Gérer les maintenances pour tous les véhicules
                  </p>
                </div>

                {hasPermission("MaintenanceReparations", "creer") && (
                  <button
                    onClick={handleAddMaintenance}
                    className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition duration-300 flex items-center space-x-2"
                    disabled={isLoading}
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>PROGRAMMER UNE MAINTENANCE</span>
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <input
                  type="text"
                  placeholder="Rechercher par véhicule, nom, type d'intervention, mécanicien ou garage"
                  className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-96"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                />
                <div className="flex gap-4 w-full sm:w-auto">
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
                  <div className="flex gap-4">
                  <select value={eisenhowerFilter} onChange={(e) => setEisenhowerFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Tous">Tous Eisenhower</option>
                  <option value="Faire immédiatement">Faire immédiatement</option>
                  <option value="Planifier">Planifier</option>
                  <option value="Déléguer">Déléguer</option>
                  <option value="Éliminer/Reporter">Éliminer/Reporter</option>
                </select>
                <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Tableau">Vue Tableau</option>
                  <option value="Kanban">Vue Kanban</option>
                </select>
                  </div>
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
              {viewMode === "Tableau" ? (
                <>
                <div className="flex flex-col mt-6">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                              <th className="px-6 py-3.5 text-sm font-bold text-left branchetext-gray-500 dark:text-gray-400">
                                STATUT
                              </th>
                              <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                                NOTES
                              </th>
                              <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                                KILOMÉTRAGE
                              </th>
                              <th className="px-6 py-3.5 text-sm font-bold text-left text-gray-500 dark:text-gray-400">
                                ACTIONS
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                            {currentMaintenances.length > 0 ? (
                              currentMaintenances.map((maintenance, index) => (
                                <tr key={maintenance._id}>
                                  <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    {maintenance.vehicule?.marque || "N/A"}{" "}
                                    {maintenance.vehicule?.modele || ""} (
                                    {maintenance.vehicule?.immatriculation ||
                                      "N/A"}
                                    )
                                  </td>
                                  <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    <span
                                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium border-2 ${getInterventionTypeStyles(
                                        maintenance.typeMaintenance
                                          ?.type_intervention
                                      )}`}
                                      aria-label={`Type d'intervention: ${
                                        maintenance.typeMaintenance
                                          ?.type_intervention || "N/A"
                                      }`}
                                    >
                                      {maintenance.typeMaintenance
                                        ?.type_intervention || "N/A"}
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
                                      ? new Date(
                                          maintenance.datePrevue
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </td>
                                  <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    {maintenance.dateReservation
                                      ? new Date(
                                          maintenance.dateReservation
                                        ).toLocaleDateString()
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
                                  <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 relative">
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => {
                                          setOpenMenuId(
                                            openMenuId === maintenance._id
                                              ? null
                                              : maintenance._id
                                          );
                                          
                                        }}
                                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                        disabled={isLoading}
                                      >
                                        <EllipsisVerticalIcon className="h-5 w-5" />
                                      </button>
                                      {openMenuId === maintenance._id && (
                                        <div
                                          ref={menuRef}
                                          className={`absolute right-0 ${
                                            index >=
                                            currentMaintenances.length - 2
                                              ? "bottom-full mb-1"
                                              : "top-full mt-1"
                                          } w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10`}
                                        >
                                          {hasPermission(
                                            "MaintenanceReparations",
                                            "modifier"
                                          ) && (
                                            <button
                                              onClick={() =>
                                                handleEditMaintenance(
                                                  maintenance
                                                )
                                              }
                                              className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
                                              disabled={isLoading}
                                            >
                                              Modifier
                                            </button>
                                          )}
                                          {(hasPermission(
                                            "MaintenanceReparations",
                                            "changer_statut"
                                          ) ||
                                            hasPermission(
                                              "MaintenanceReparations",
                                              "modifier"
                                            )) &&
                                            maintenance.statut =="Backlog" ||  maintenance.statut == "À faire" ? (
                                              <button
                                                onClick={() =>
                                                  startMaintenance(maintenance)
                                                }
                                                className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                                                disabled={isLoading}
                                              >
                                                Commencer
                                              </button>
                                            ) : null}
                                          {(hasPermission(
                                            "MaintenanceReparations",
                                            "changer_statut"
                                          ) ||
                                            hasPermission(
                                              "MaintenanceReparations",
                                              "modifier"
                                            )) &&
                                            maintenance.statut === "En cours" || maintenance.statut === "Vérification" ?(
                                              <button
                                                onClick={() =>
                                                  completeMaintenance(
                                                    maintenance._id,
                                                    maintenance.typeMaintenance
                                                      ?.nom || "N/A",
                                                    maintenance.vehicule
                                                  )
                                                }
                                                className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                                                disabled={isLoading}
                                              >
                                                Terminer
                                              </button>
                                            ):null}
                                          {hasPermission(
                                            "MaintenanceReparations",
                                            "supprimer"
                                          ) && (
                                            <button
                                              onClick={() =>
                                                deleteMaintenance(
                                                  maintenance._id,
                                                  maintenance.typeMaintenance
                                                    ?.nom || "N/A",
                                                  maintenance.vehicule
                                                )
                                              }
                                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                              disabled={isLoading}
                                            >
                                              Supprimer
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="11"
                                  className="py-6 text-center text-gray-500"
                                >
                                  Aucune maintenance trouvée.
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
                ) : (
                  renderKanbanView()
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleMaintenance;