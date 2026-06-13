import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";
import {
  Car,
  Calendar,
  Clock,
  User,
  Droplets,
  ClipboardList,
  PenTool,
  UserCheck,
  Upload,
  XCircle,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import "react-toastify/dist/ReactToastify.css";
import usePermissions from "../hooks/usePermissions";
import defaultCarImage from '../assets/defaultCarImage.png';

const API_BASE_URL = "http://localhost:5000/api";
const MySwal = withReactContent(Swal);

export default function FicheReception() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [formData, setFormData] = useState({
    maintenanceId: "",
    date: "",
    time: "",
    receivedBy: "",
    employee: "", // Stores ObjectId
    carMake: "",
    licensePlate: "",
    mileage: "",
    fuelLevel: "",
    engineOilLevel: "",
    coolantLevel: "",
    brakeFluidLevel: "",
    otherFluids: "",
    periodicMaintenance: false,
    mechanicalRepair: false,
    electricalIssue: false,
    otherReason: false,
    otherReasonText: "",
    unusualNoise: false,
    powerLoss: false,
    warningLight: false,
    otherProblems: "",
    visualChecks: "",
    preInterventionDiagnosis: "",
    uploadedImage: null,
    markerPositions: [],
    employeeSignatureDate: "",
    mechanicSignatureDate: "",
  });
  const [employeeName, setEmployeeName] = useState(""); // Stores display name
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(null);
  const [requestedParts, setRequestedParts] = useState([]);
  const [newPart, setNewPart] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [employeeError, setEmployeeError] = useState("");
  const imageRef = useRef(null);

  // Fetch drivers
  useEffect(() => {
    if (permissionsLoading) return;

    if (!hasPermission("FicheReceptions", "creer")) {
      MySwal.fire({
        icon: 'error',
        title: 'Permission refusée',
        text: 'Vous n\'avez pas la permission de créer une fiche de réception.',
        confirmButtonColor: '#6366f1',
      }).then(() => {
        navigate("/ScheduleMaintenance");
      });
      return;
    }

    const fetchDrivers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/drivers`);
        setDrivers(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des conducteurs:", error);
        MySwal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de récupérer la liste des conducteurs.',
          confirmButtonColor: '#6366f1',
        });
      }
    };
    fetchDrivers();
  }, [hasPermission, navigate, permissionsLoading]);

  // Initialize form data and employee name
  useEffect(() => {
    if (location.state) {
      const { maintenanceId, vehicle, mechanic, date, time } = location.state;
      
      // Récupérer le conducteur assigné au véhicule
      const fetchVehicleDriver = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/vehicules/${vehicle._id}`);
          const vehicleData = response.data;
          
          // Si le véhicule a un conducteur assigné
          if (vehicleData.conducteur) {
            setFormData(prev => ({
              ...prev,
              maintenanceId: maintenanceId || "",
              date: date || "",
              time: time || "",
              receivedBy: mechanic ? `${mechanic.nom} ${mechanic.prenom}` : "",
              carMake: vehicle ? `${vehicle.marque} ${vehicle.modele}` : "",
              licensePlate: vehicle?.immatriculation || "",
              mileage: vehicle?.kilometrage ? vehicle.kilometrage.toString() : "",
              employee: vehicleData.conducteur._id || "",
            }));
            
            // Définir le nom du conducteur
            setEmployeeName(vehicleData.conducteur ? 
              `${vehicleData.conducteur.nom} ${vehicleData.conducteur.prenom}` : 
              ""
            );
          } else {
            // Si pas de conducteur assigné
            setFormData(prev => ({
              ...prev,
              maintenanceId: maintenanceId || "",
              date: date || "",
              time: time || "",
              receivedBy: mechanic ? `${mechanic.nom} ${mechanic.prenom}` : "",
              carMake: vehicle ? `${vehicle.marque} ${vehicle.modele}` : "",
              licensePlate: vehicle?.immatriculation || "",
              mileage: vehicle?.kilometrage ? vehicle.kilometrage.toString() : "",
              employee: "",
            }));
            setEmployeeName("");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données du véhicule:", error);
          // En cas d'erreur, initialiser sans le conducteur
          setFormData(prev => ({
            ...prev,
            maintenanceId: maintenanceId || "",
            date: date || "",
            time: time || "",
            receivedBy: mechanic ? `${mechanic.nom} ${mechanic.prenom}` : "",
            carMake: vehicle ? `${vehicle.marque} ${vehicle.modele}` : "",
            licensePlate: vehicle?.immatriculation || "",
            mileage: vehicle?.kilometrage ? vehicle.kilometrage.toString() : "",
            employee: "",
          }));
          setEmployeeName("");
        }
      };

      fetchVehicleDriver();
    } else {
      console.warn("No location state provided");
      MySwal.fire({
        icon: 'warning',
        title: 'Données manquantes',
        text: 'Aucune donnée de maintenance fournie. Veuillez sélectionner une maintenance.',
        confirmButtonColor: '#6366f1',
      }).then(() => {
        navigate("/ScheduleMaintenance");
      });
    }
  }, [location.state, navigate]);

  // Image loading effect
  useEffect(() => {
    setImageLoaded(false);
    setImageLoadError(null);

    const imageSrc = formData.uploadedImage ? `http://localhost:5000${formData.uploadedImage}` : defaultCarImage;

    if (imageRef.current && imageRef.current.complete) {
      setImageLoaded(true);
      return;
    }

    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = (error) => {
      console.error("Error loading image (new Image):", imageSrc, error);
      setImageLoaded(false);
      setImageLoadError("Impossible de charger l'image. Vérifiez l'URL ou le fichier.");
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [formData.uploadedImage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "employee") {
      setEmployeeName(value);
      const fullName = value.trim();
      if (!fullName) {
        setFormData((prev) => ({ ...prev, employee: "" }));
        setEmployeeError("");
        return;
      }
      const [nom, prenom] = fullName.split(" ").filter(Boolean);
      if (nom && prenom) {
        const matchedDriver = drivers.find(
          (driver) => driver.nom.toLowerCase() === nom.toLowerCase() && driver.prenom.toLowerCase() === prenom.toLowerCase()
        );
        if (matchedDriver) {
          setFormData((prev) => ({ ...prev, employee: matchedDriver._id }));
          setEmployeeError("");
        } else {
          setFormData((prev) => ({ ...prev, employee: "" }));
          setEmployeeError("Aucun conducteur trouvé avec ce nom.");
        }
      } else {
        setFormData((prev) => ({ ...prev, employee: "" }));
        setEmployeeError("Veuillez entrer le nom complet (Nom Prénom).");
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        MySwal.fire({
          icon: 'error',
          title: 'Format incorrect',
          text: 'Veuillez sélectionner une image valide.',
          confirmButtonColor: '#6366f1',
        });
        return;
      }

      const uploadData = new FormData();
      uploadData.append('image', file);
      try {
        const response = await axios.post(`${API_BASE_URL}/reception-fiches/upload-image`, uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setFormData((prev) => ({
          ...prev,
          uploadedImage: response.data.imageUrl,
          markerPositions: [],
        }));
      } catch (error) {
        console.error("Erreur lors de l'upload de l'image:", error);
        console.error("Détails de l'erreur:", error.response?.data);
        MySwal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.message || 'Impossible de télécharger l\'image.',
          confirmButtonColor: '#6366f1',
        });
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageLoadError(null);
  };

  const handleImageError = () => {
    console.error("Error loading image (DOM):", imageRef.current.src);
    setImageLoaded(false);
    setImageLoadError("Impossible de charger l'image. Vérifiez l'URL ou le fichier.");
  };

  const handleImageClick = (e) => {

    if (!imageRef.current || !imageLoaded) {
      console.warn("Image not loaded or imageRef missing:", { imageLoaded, imageRef: imageRef.current });
      MySwal.fire({
        icon: 'warning',
        title: 'Image non chargée',
        text: 'Veuillez attendre que l\'image soit chargée avant d\'ajouter des marqueurs.',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    if (naturalWidth === 0 || naturalHeight === 0) {
      console.error("Image dimensions are zero:", { naturalWidth, naturalHeight });
      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Les dimensions de l\'image ne peuvent pas être déterminées.',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = (x / rect.width) * naturalWidth;
    const normalizedY = (y / rect.height) * naturalHeight;


    if (
      normalizedX >= 0 &&
      normalizedX <= naturalWidth &&
      normalizedY >= 0 &&
      normalizedY <= naturalHeight
    ) {
      setFormData((prev) => ({
        ...prev,
        markerPositions: [...prev.markerPositions, { x: normalizedX, y: normalizedY }],
      }));
    } else {
      console.warn("Click outside image bounds:", { normalizedX, normalizedY, naturalWidth, naturalHeight });
    }
  };

  const handleClearMarkers = () => {
    setFormData((prev) => ({
      ...prev,
      markerPositions: [],
    }));
  };

  const handleAddPart = () => {
    if (newPart.trim()) {
      setRequestedParts((prev) => [...prev, newPart.trim()]);
      setNewPart("");
    }
  };

  const handleRemovePart = (index) => {
    setRequestedParts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      { key: "maintenanceId", label: "ID de maintenance" },
      { key: "date", label: "Date" },
      { key: "time", label: "Heure" },
      { key: "receivedBy", label: "Véhicule réceptionné par" },
      { key: "carMake", label: "Marque/Modèle" },
      { key: "licensePlate", label: "Immatriculation" },
      { key: "mileage", label: "Kilométrage" },
    ];

    // Vérifier les champs requis
    for (const field of requiredFields) {
      if (!formData[field.key]) {
        MySwal.fire({
          icon: 'error',
          title: 'Champ manquant',
          text: `Le champ ${field.label} est requis.`,
          confirmButtonColor: '#6366f1',
        });
        return;
      }
    }

    if (formData.mileage && (isNaN(formData.mileage) || Number(formData.mileage) < 0)) {
      MySwal.fire({
        icon: 'error',
        title: 'Valeur incorrecte',
        text: 'Le kilométrage doit être un nombre positif.',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    if (
      !formData.periodicMaintenance &&
      !formData.mechanicalRepair &&
      !formData.electricalIssue &&
      !formData.otherReason
    ) {
      MySwal.fire({
        icon: 'error',
        title: 'Motif manquant',
        text: 'Veuillez sélectionner au moins un motif de visite.',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    if (formData.otherReason && !formData.otherReasonText.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Détails manquants',
        text: 'Veuillez préciser le motif dans le champ "Autre".',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    if (employeeError) {
      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
        text: employeeError,
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    const cleanedFormData = {
      ...formData,
      mileage: Number(formData.mileage),
      otherReasonText: formData.otherReason ? formData.otherReasonText : "",
      otherProblems: formData.otherProblems.trim() || "",
      visualChecks: formData.visualChecks.trim() || "",
      preInterventionDiagnosis: formData.preInterventionDiagnosis.trim() || "",
      uploadedImage: formData.uploadedImage || null,
      markerPositions: formData.markerPositions.length > 0 ? formData.markerPositions : [],
      requestedParts: requestedParts.length > 0 ? requestedParts : [],
    };

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/reception-fiches/reception-fiche`,
        cleanedFormData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (requestedParts.length > 0) {
        const mechanicId = location.state?.mechanic?._id;
        if (!mechanicId) {
          throw new Error("ID du mécanicien non trouvé dans les données de la maintenance.");
        }

        await axios.post(
          `${API_BASE_URL}/reception-fiches/reception-fiche/request-parts`,
          {
            ficheId: response.data.fiche._id,
            mechanicId: mechanicId,
            parts: requestedParts,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      await MySwal.fire({
        icon: 'success',
        title: 'Succès!',
        html: '<div class="text-center"><svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><h3 class="text-xl font-medium text-gray-900 mt-3">Fiche enregistrée avec succès!</h3><p class="text-gray-600 mt-2">Vous allez être redirigé vers la page des maintenances.</p></div>',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: '#f8fafc',
      });

      setFormData({
        maintenanceId: "",
        date: "",
        time: "",
        receivedBy: "",
        employee: "",
        carMake: "",
        licensePlate: "",
        mileage: "",
        fuelLevel: "",
        engineOilLevel: "",
        coolantLevel: "",
        brakeFluidLevel: "",
        otherFluids: "",
        periodicMaintenance: false,
        mechanicalRepair: false,
        electricalIssue: false,
        otherReason: false,
        otherReasonText: "",
        unusualNoise: false,
        powerLoss: false,
        warningLight: false,
        otherProblems: "",
        visualChecks: "",
        preInterventionDiagnosis: "",
        uploadedImage: null,
        markerPositions: [],
        employeeSignatureDate: "",
        mechanicSignatureDate: "",
      });
      setEmployeeName("");
      setRequestedParts([]);
      setNewPart("");
      navigate("/ScheduleMaintenance");
    } catch (error) {
      console.error("Erreur lors de la création de la fiche:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Une erreur est survenue lors de l'enregistrement de la fiche.";

      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        confirmButtonColor: '#6366f1',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (permissionsLoading) {
    return <div className="p-8 text-center">Chargement des permissions...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 sm:py-6 md:py-10 px-2 sm:px-4">
      <div className="max-w-5xl mx-auto border-none shadow-xl overflow-hidden rounded-lg bg-white">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 text-white py-4 sm:py-6 md:py-8 px-4 sm:px-6">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3">
            <Car className="h-6 w-6 sm:h-8 sm:w-8" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-center">
              FICHE DE RÉCEPTION ATELIER
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <label htmlFor="date" className="font-medium">
                    Date
                  </label>
                </div>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <label htmlFor="time" className="font-medium">
                    Heure
                  </label>
                </div>
                <input
                  id="time"
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-indigo-500" />
                  <label htmlFor="receivedBy" className="font-medium">
                    Véhicule réceptionné par
                  </label>
                </div>
                <input
                  id="receivedBy"
                  type="text"
                  name="receivedBy"
                  value={formData.receivedBy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-lg font-semibold">Informations véhicule</h2>
                </div>
              </div>
              <div className="p-3 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="carMake" className="font-medium">
                      Marque/Modèle
                    </label>
                    <input
                      id="carMake"
                      type="text"
                      name="carMake"
                      value={formData.carMake}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="licensePlate" className="font-medium">
                      Immatriculation
                    </label>
                    <input
                      id="licensePlate"
                      type="text"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="mileage" className="font-medium">
                      Kilométrage
                    </label>
                    <input
                      id="mileage"
                      type="number"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="employee" className="font-medium">
                      Employé
                    </label>
                    <input
                      id="employee"
                      type="text"
                      name="employee"
                      value={employeeName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${employeeError ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Nom Prénom (ex: Dupont Jean)"
                      
                    />
                    {employeeError && <p className="text-red-500 text-sm mt-1">{employeeError}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex space-x-1 whitespace-nowrap">
                <button
                  type="button"
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-100 rounded-t-lg border-b-2 border-indigo-500"
                  onClick={() =>
                    document.getElementById("fluids").scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Niveaux fluides
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                  onClick={() =>
                    document.getElementById("exterior").scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Extérieur
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                  onClick={() =>
                    document.getElementById("reason").scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Motif de la visite
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                  onClick={() =>
                    document.getElementById("problems").scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Problèmes identifiés
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                  onClick={() =>
                    document.getElementById("observations").scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Observations
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                  onClick={() =>
                    document.getElementById("parts-request").scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Demande de pièces
                </button>
              </div>
            </div>

            <div id="fluids" className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-base sm:text-lg font-semibold">Niveaux fluides</h2>
                  </div>
                </div>
                <div className="p-3 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="fuelLevel" className="font-medium">
                        Carburant
                      </label>
                      <input
                        id="fuelLevel"
                        type="text"
                        name="fuelLevel"
                        value={formData.fuelLevel}
                        placeholder="1/8"
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="engineOilLevel" className="font-medium">
                        Huile moteur
                      </label>
                      <input
                        id="engineOilLevel"
                        type="text"
                        name="engineOilLevel"
                        value={formData.engineOilLevel}
                        placeholder="4/8"

                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="coolantLevel" className="font-medium">
                        Liquide refroidissement
                      </label>
                      <input
                        id="coolantLevel"
                        type="text"
                        name="coolantLevel"
                        placeholder="3/8"

                        value={formData.coolantLevel}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="brakeFluidLevel" className="font-medium">
                        Liquide de frein
                      </label>
                      <input
                        id="brakeFluidLevel"
                        type="text"
                        name="brakeFluidLevel"
                        placeholder="5/8"
                        value={formData.brakeFluidLevel}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2 col-span-1 sm:col-span-2">
                      <label htmlFor="otherFluids" className="font-medium">
                        Autres
                      </label>
                      <input
                        id="otherFluids"
                        type="text"
                        name="otherFluids"
                        value={formData.otherFluids}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="exterior" className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-base sm:text-lg font-semibold">Extérieur</h2>
                  </div>
                </div>
                <div className="p-3 sm:p-5">
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-4">
                      <label
                        htmlFor="imageUpload"
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer transition-all"
                      >
                        <Upload className="h-5 w-5" />
                        <span>Charger une image</span>
                      </label>
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={handleClearMarkers}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all"
                        disabled={formData.markerPositions.length === 0}
                      >
                        <XCircle className="h-5 w-5" />
                        <span>Effacer les marqueurs</span>
                      </button>
                    </div>
                    <div className="flex justify-center relative">
                      <div className="relative w-full sm:w-96 h-48">
                        {imageLoadError ? (
                          <div className="w-full h-full flex items-center justify-center bg-red-100 rounded-lg border border-red-300">
                            <p className="text-red-500">{imageLoadError}</p>
                          </div>
                        ) : (
                          <img
                            ref={imageRef}
                            src={formData.uploadedImage ? `http://localhost:5000${formData.uploadedImage}` : defaultCarImage}
                            alt="Vehicle Diagram"
                            className="w-full h-full object-contain rounded-lg border border-gray-300 cursor-pointer"
                            onClick={handleImageClick}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            style={{ display: imageLoaded ? 'block' : 'none' }}
                          />
                        )}
                        {!imageLoaded && !imageLoadError && (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300 absolute top-0 left-0">
                            <p className="text-gray-500">Chargement de l'image...</p>
                          </div>
                        )}
                        {imageLoaded &&
                          formData.markerPositions.map((pos, index) => {
                            const naturalWidth = imageRef.current?.naturalWidth || 1;
                            const naturalHeight = imageRef.current?.naturalHeight || 1;
                            const leftPercent = (pos.x / naturalWidth) * 100;
                            const topPercent = (pos.y / naturalHeight) * 100;
                            return (
                              <div
                                key={`marker-${index}`}
                                className="absolute w-4 h-4 bg-red-600 rounded-full -translate-x-1/2 -translate-y-1/2 z-10"
                                style={{
                                  left: `${leftPercent}%`,
                                  top: `${topPercent}%`,
                                }}
                              />
                            );
                          })}
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-500">
                      Cliquez sur l'image pour indiquer les lieux de panne
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div id="reason" className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-base sm:text-lg font-semibold">Motif de la visite</h2>
                  </div>
                </div>
                <div className="p-3 sm:p-5 space-y-4 sm:space-y-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="periodicMaintenance"
                        name="periodicMaintenance"
                        checked={formData.periodicMaintenance}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="periodicMaintenance" className="text-sm">
                        Entretien périodique
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="mechanicalRepair"
                        name="mechanicalRepair"
                        checked={formData.mechanicalRepair}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="mechanicalRepair" className="text-sm">
                        Réparation mécanique
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="electricalIssue"
                        name="electricalIssue"
                        checked={formData.electricalIssue}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="electricalIssue" className="text-sm">
                        Problème électrique/électronique
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="otherReason"
                        name="otherReason"
                        checked={formData.otherReason}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="otherReason" className="text-sm">
                        Autre
                      </label>
                    </div>

                    {formData.otherReason && (
                      <div className="mt-2">
                        <input
                          type="text"
                          name="otherReasonText"
                          value={formData.otherReasonText}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div id="problems" className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-base sm:text-lg font-semibold">Problèmes identifiés</h2>
                  </div>
                </div>
                <div className="p-3 sm:p-5 space-y-4 sm:space-y-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="unusualNoise"
                        name="unusualNoise"
                        checked={formData.unusualNoise}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="unusualNoise" className="text-sm">
                        Bruit inhabituel
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="powerLoss"
                        name="powerLoss"
                        checked={formData.powerLoss}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="powerLoss" className="text-sm">
                        Perte de puissance
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="warningLight"
                        name="warningLight"
                        checked={formData.warningLight}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="warningLight" className="text-sm">
                        Voyant allumé
                      </label>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="otherProblems" className="font-medium">
                        Autres
                      </label>
                      <input
                        id="otherProblems"
                        type="text"
                        name="otherProblems"
                        value={formData.otherProblems}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="observations" className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-base sm:text-lg font-semibold">Observations du garage</h2>
                  </div>
                </div>
                <div className="p-3 sm:p-5 space-y-4 sm:space-y-6">
                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="visualChecks" className="font-medium">
                      Vérifications visuelles
                    </label>
                    <textarea
                      id="visualChecks"
                      name="visualChecks"
                      value={formData.visualChecks}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      rows="4"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="preInterventionDiagnosis" className="font-medium">
                      Diagnostic avant intervention
                    </label>
                    <textarea
                      id="preInterventionDiagnosis"
                      name="preInterventionDiagnosis"
                      value={formData.preInterventionDiagnosis}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      rows="4"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div id="parts-request" className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md">
                <div className="p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-800">Demande de pièces</h2>
                  </div>
                </div>
                <div className="p-5 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      value={newPart}
                      onChange={(e) => setNewPart(e.target.value)}
                      placeholder="Nom de la pièce (ex : Filtre à huile)"
                      className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddPart}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {requestedParts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700">Pièces demandées :</h3>
                      <ul className="space-y-2">
                        {requestedParts.map((part, index) => (
                          <li
                            key={index}
                            className="flex justify-between items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-800"
                          >
                            <span>{part}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePart(index)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center md:justify-end mt-6 md:mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 text-white text-base sm:text-lg font-bold rounded-lg shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all transform ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Enregistrement..." : "Enregistrer la réception"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ToastContainer position="top-right" autoClose={8000} />
    </div>
  );
}