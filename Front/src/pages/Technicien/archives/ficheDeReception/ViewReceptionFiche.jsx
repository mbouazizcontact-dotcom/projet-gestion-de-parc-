import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import usePermissions from "../../../../hooks/usePermissions";
import defaultCarImage from "../../../../assets/defaultCarImage.png";

const API_BASE_URL = "http://localhost:5000/api";
const MySwal = withReactContent(Swal);

const ViewReceptionFiche = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [formData, setFormData] = useState({
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
    requestedParts: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(null);
  const imageRef = useRef(null);
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (permissionsLoading) return;

    if (!hasPermission("FicheReceptions", "lire")) {
      MySwal.fire({
        icon: "error",
        title: "Permission refusée",
        text: "Vous n'avez pas la permission de voir les fiches de réception.",
        confirmButtonColor: "#6366f1",
      }).then(() => {
        navigate("/archiveFicheDeReception");
      });
      return;
    }

    const fetchFiche = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/reception-fiches/reception-fiche/${id}`
        );
        const fiche = response.data;
        setFormData({
          maintenanceId: fiche.maintenanceId || "",
          date: fiche.date
            ? new Date(fiche.date).toISOString().split("T")[0]
            : "",
          time: fiche.time || "",
          receivedBy: fiche.receivedBy || "",
          employee: fiche.employee
            ? `${fiche.employee.nom} ${fiche.employee.prenom}`
            : "",
          carMake: fiche.carMake || "",
          licensePlate: fiche.licensePlate || "",
          mileage: fiche.mileage ? fiche.mileage.toString() : "",
          fuelLevel: fiche.fuelLevel || "",
          engineOilLevel: fiche.engineOilLevel || "",
          coolantLevel: fiche.coolantLevel || "",
          brakeFluidLevel: fiche.brakeFluidLevel || "",
          otherFluids: fiche.otherFluids || "",
          periodicMaintenance: fiche.periodicMaintenance || false,
          mechanicalRepair: fiche.mechanicalRepair || false,
          electricalIssue: fiche.electricalIssue || false,
          otherReason: fiche.otherReason || false,
          otherReasonText: fiche.otherReasonText || "",
          unusualNoise: fiche.unusualNoise || false,
          powerLoss: fiche.powerLoss || false,
          warningLight: fiche.warningLight || false,
          otherProblems: fiche.otherProblems || "",
          visualChecks: fiche.visualChecks || "",
          preInterventionDiagnosis: fiche.preInterventionDiagnosis || "",
          uploadedImage: fiche.uploadedImage || null,
          markerPositions: fiche.markerPositions || [],
          employeeSignatureDate: fiche.employeeSignatureDate
            ? new Date(fiche.employeeSignatureDate).toISOString().split("T")[0]
            : "",
          mechanicSignatureDate: fiche.mechanicSignatureDate
            ? new Date(fiche.mechanicSignatureDate).toISOString().split("T")[0]
            : "",
          requestedParts: fiche.requestedParts || [],
        });

        console.log("Données récupérées - uploadedImage:", fiche.uploadedImage);
        console.log(
          "Données récupérées - markerPositions:",
          fiche.markerPositions
        );
        console.log(
          "Données récupérées - requestedParts:",
          fiche.requestedParts
        );
      } catch (error) {
        console.error("Erreur lors de la récupération de la fiche:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Impossible de charger la fiche de réception.";
        toast.error(errorMessage);
        MySwal.fire({
          icon: "error",
          title: "Erreur",
          text: errorMessage,
          confirmButtonColor: "#6366f1",
        }).then(() => {
          navigate("/archiveFicheDeReception");
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiche();
  }, [id, permissionsLoading, hasPermission, navigate]);

  useEffect(() => {
    setImageLoaded(false);
    setImageLoadError(null);

    const imageSrc = formData.uploadedImage
      ? `http://localhost:5000${formData.uploadedImage}`
      : defaultCarImage;
    console.log("Attempting to load image:", imageSrc);
    console.log("Marker positions available:", formData.markerPositions);

    if (imageRef.current && imageRef.current.complete) {
      console.log("Image already loaded in DOM:", imageSrc);
      const naturalWidth = imageRef.current.naturalWidth || 1;
      const naturalHeight = imageRef.current.naturalHeight || 1;
      setImageNaturalDimensions({ width: naturalWidth, height: naturalHeight });
      setImageLoaded(true);
      return;
    }

    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      console.log("Image loaded successfully (new Image):", imageSrc);
      console.log("Image dimensions:", img.naturalWidth, img.naturalHeight);
      setImageNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };

    img.onerror = (error) => {
      console.error("Error loading image (new Image):", imageSrc, error);
      setImageLoaded(false);
      setImageLoadError(
        "Impossible de charger l'image. Vérifiez l'URL ou le fichier."
      );
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [formData.uploadedImage, formData.markerPositions]);

  const handleImageLoad = () => {
    console.log("Image loaded successfully (DOM):", imageRef.current.src);
    const naturalWidth = imageRef.current.naturalWidth || 1;
    const naturalHeight = imageRef.current.naturalHeight || 1;
    setImageNaturalDimensions({ width: naturalWidth, height: naturalHeight });
    console.log("Image natural dimensions:", naturalWidth, naturalHeight);
    setImageLoaded(true);
    setImageLoadError(null);
  };

  const handleImageError = () => {
    console.error("Error loading image (DOM):", imageRef.current.src);
    setImageLoaded(false);
    setImageLoadError(
      "Impossible de charger l'image. Vérifiez l'URL ou le fichier."
    );
  };

  const handleDelete = async () => {
    if (!hasPermission("FicheReceptions", "supprimer")) {
      MySwal.fire({
        icon: "error",
        title: "Permission refusée",
        text: "Vous n'avez pas la permission de supprimer une fiche de réception.",
        confirmButtonColor: "#6366f1",
      });
      return;
    }

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
        await axios.delete(
          `${API_BASE_URL}/reception-fiches/reception-fiche/${id}`
        );
        toast.success("Fiche de réception supprimée avec succès.");
        MySwal.fire({
          icon: "success",
          title: "Supprimée",
          text: "La fiche de réception a été supprimée avec succès.",
          confirmButtonColor: "#6366f1",
        }).then(() => {
          navigate("/archiveFicheDeReception");
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

  // Filtrer les doublons dans requestedParts
  const uniqueRequestedParts = [...new Set(formData.requestedParts)];

  if (permissionsLoading) {
    return <div className="p-8 text-center">Chargement des permissions...</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center">Chargement de la fiche...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 sm:py-6 md:py-10 px-2 sm:px-4">
      <div className="max-w-5xl mx-auto border-none shadow-xl overflow-hidden rounded-lg bg-white">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 text-white py-4 sm:py-6 md:py-8 px-4 sm:px-6">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3">
            <Car className="h-6 w-6 sm:h-8 sm:w-8" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-center">
              DÉTAILS DE LA FICHE DE RÉCEPTION
            </h1>
          </div>
        </div>

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
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                    value={formData.employee}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                  />
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
                  document
                    .getElementById("fluids")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Niveaux fluides
              </button>
              <button
                type="button"
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                onClick={() =>
                  document
                    .getElementById("exterior")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Extérieur
              </button>
              <button
                type="button"
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                onClick={() =>
                  document
                    .getElementById("reason")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Motif de la visite
              </button>
              <button
                type="button"
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                onClick={() =>
                  document
                    .getElementById("problems")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Problèmes identifiés
              </button>
              <button
                type="button"
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                onClick={() =>
                  document
                    .getElementById("requestedParts")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Pièces demandées
              </button>
              <button
                type="button"
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                onClick={() =>
                  document
                    .getElementById("observations")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Observations
              </button>
            </div>
          </div>

          <div id="fluids" className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Droplets className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-base sm:text-lg font-semibold">
                    Niveaux fluides
                  </h2>
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
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                      value={formData.coolantLevel}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                      value={formData.brakeFluidLevel}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                  <div className="flex justify-center relative">
                    <div className="relative w-full max-w-md h-48">
                      {imageLoadError ? (
                        <div className="w-full h-full flex items-center justify-center bg-red-100 rounded-lg border border-red-300">
                          <p className="text-red-500">{imageLoadError}</p>
                        </div>
                      ) : (
                        <>
                          <img
                            ref={imageRef}
                            src={
                              formData.uploadedImage
                                ? `http://localhost:5000${formData.uploadedImage}`
                                : defaultCarImage
                            }
                            alt="Vehicle Diagram"
                            className="w-full h-full object-contain rounded-lg border border-gray-300"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            style={{ display: imageLoaded ? "block" : "none" }}
                          />
                          {!imageLoaded && !imageLoadError && (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300 absolute top-0 left-0">
                              <p className="text-gray-500">Chargement de l'image...</p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Render markers only when image is loaded */}
                      {imageLoaded && formData.markerPositions?.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {formData.markerPositions.map((pos, index) => {
                            const naturalWidth = imageNaturalDimensions.width || imageRef.current?.naturalWidth || 1;
                            const naturalHeight = imageNaturalDimensions.height || imageRef.current?.naturalHeight || 1;
                            const leftPercent = (pos.x / naturalWidth) * 100;
                            const topPercent = (pos.y / naturalHeight) * 100;

                            console.log(`Marker ${index} position:`, {
                              original: { x: pos.x, y: pos.y },
                              calculated: { leftPercent, topPercent },
                              imageDimensions: {
                                natural: { width: naturalWidth, height: naturalHeight },
                                displayed: {
                                  width: imageRef.current?.clientWidth,
                                  height: imageRef.current?.clientHeight,
                                },
                              },
                            });

                            // Ensure markers are within bounds
                            if (leftPercent < 0 || leftPercent > 100 || topPercent < 0 || topPercent > 100) {
                              console.warn(`Marker ${index} is out of bounds:`, { leftPercent, topPercent });
                              return null;
                            }

                            return (
                              <div
                                key={`marker-${index}`}
                                className="absolute w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"
                                style={{
                                  left: `${leftPercent}%`,
                                  top: `${topPercent}%`,
                                }}
                                title={`Marqueur ${index + 1}`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    Image du véhicule avec les marqueurs de panne
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
                  <h2 className="text-base sm:text-lg font-semibold">
                    Motif de la visite
                  </h2>
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
                      disabled
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
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
                      disabled
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
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
                      disabled
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
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
                      disabled
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
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
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
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
                  <h2 className="text-base sm:text-lg font-semibold">
                    Problèmes identifiés
                  </h2>
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
                      disabled
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
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
                      disabled
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
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
                      disabled
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
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
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="requestedParts" className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-base sm:text-lg font-semibold">
                    Pièces demandées
                  </h2>
                </div>
              </div>
              <div className="p-3 sm:p-5">
                {uniqueRequestedParts && uniqueRequestedParts.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                    {uniqueRequestedParts.map((part, index) => (
                      <li key={`part-${index}`}>{part}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    Aucune pièce demandée.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div id="observations" className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-base sm:text-lg font-semibold">
                    Observations du garage
                  </h2>
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
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                    rows="4"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label
                    htmlFor="preInterventionDiagnosis"
                    className="font-medium"
                  >
                    Diagnostic avant intervention
                  </label>
                  <textarea
                    id="preInterventionDiagnosis"
                    name="preInterventionDiagnosis"
                    value={formData.preInterventionDiagnosis}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                    rows="4"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center md:justify-end mt-6 md:mt-8 space-x-4">
            <button
              onClick={() => navigate("/archiveFicheDeReception")}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-all"
            >
              Retour à l'historique
            </button>
            {hasPermission("FicheReceptions", "supprimer") && (
              <button
                onClick={handleDelete}
                className="px-6 py-3 sm:px-8 sm:py-4 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-all flex items-center"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={8000} />
    </div>
  );
};

export default ViewReceptionFiche;