import { useState, useEffect } from "react";
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
  Filter,
  RotateCw,
  Wrench,
  ClipboardList,
  PenTool,
  UserCheck,
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import usePermissions from "../../../../hooks/usePermissions";

const API_BASE_URL = "http://localhost:5000/api";
const MySwal = withReactContent(Swal);

const ViewRepairIntervention = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    mechanic: "",
    carMake: "",
    licensePlate: "",
    mileage: "",
    oilAmount: "",
    oilFilter: false,
    airFilter: false,
    fuelFilter: false,
    cabinFilter: false,
    fluidTopUp: false,
    wheelRotation: false,
    repairs: [],
    observations: [],
    employeeSignatureDate: "",
    mechanicSignatureDate: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (permissionsLoading) return;

    if (!hasPermission("FicheInterventions", "lire")) {
      MySwal.fire({
        icon: "error",
        title: "Permission refusée",
        text: "Vous n'avez pas la permission de voir les fiches d'intervention.",
        confirmButtonColor: "#6366f1",
      }).then(() => {
        navigate("/archiveFicheIntervention");
      });
      return;
    }

    const fetchIntervention = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/repair-interventions/${id}`);
        const intervention = response.data;
        setFormData({
          date: intervention.date || "",
          time: intervention.time || "",
          mechanic: intervention.mechanic || "",
          carMake: intervention.carMake || "",
          licensePlate: intervention.licensePlate || "",
          mileage: intervention.mileage ? intervention.mileage.toString() : "",
          oilAmount: intervention.oilAmount || "",
          oilFilter: intervention.oilFilter || false,
          airFilter: intervention.airFilter || false,
          fuelFilter: intervention.fuelFilter || false,
          cabinFilter: intervention.cabinFilter || false,
          fluidTopUp: intervention.fluidTopUp || false,
          wheelRotation: intervention.wheelRotation || false,
          repairs: intervention.repairs || [],
          observations: intervention.observations || [],
          employeeSignatureDate: intervention.employeeSignatureDate || "",
          mechanicSignatureDate: intervention.mechanicSignatureDate || "",
        });
      } catch (error) {
        console.error("Erreur lors de la récupération de la fiche d'intervention:", error);
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Impossible de charger la fiche d'intervention.";
        toast.error(errorMessage);
        MySwal.fire({
          icon: "error",
          title: "Erreur",
          text: errorMessage,
          confirmButtonColor: "#6366f1",
        }).then(() => {
          navigate("/archiveFicheIntervention");
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntervention();
  }, [id, permissionsLoading, hasPermission, navigate]);

  // Fonction pour gérer la suppression
  const handleDelete = async () => {
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
        await axios.delete(`${API_BASE_URL}/repair-interventions/${id}`);
        toast.success("Fiche d'intervention supprimée avec succès.");
        MySwal.fire({
          icon: "success",
          title: "Supprimée",
          text: "La fiche d'intervention a été supprimée avec succès.",
          confirmButtonColor: "#6366f1",
        }).then(() => {
          navigate("/archiveFicheIntervention");
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
            <Wrench className="h-6 w-6 sm:h-8 sm:w-8" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-center">
              DÉTAILS DE LA FICHE D'INTERVENTION
            </h1>
          </div>
        </div>

        <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          {/* Header Section */}
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
                <label htmlFor="mechanic" className="font-medium">
                  Garagiste
                </label>
              </div>
              <input
                id="mechanic"
                type="text"
                name="mechanic"
                value={formData.mechanic}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Vehicle Information */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-semibold">Informations véhicule</h2>
              </div>
            </div>
            <div className="p-3 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
                    type="text"
                    name="mileage"
                    value={formData.mileage}
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
                  document.getElementById("maintenance").scrollIntoView({ behavior: "smooth" })
                }
              >
                Maintenance
              </button>
              <button
                type="button"
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                onClick={() =>
                  document.getElementById("repairs").scrollIntoView({ behavior: "smooth" })
                }
              >
                Réparations
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
            </div>
          </div>

          {/* Maintenance Section */}
          <div id="maintenance" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Oil Change */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-base sm:text-lg font-semibold">Vidange</h2>
                  </div>
                </div>
                <div className="p-3 sm:p-5 space-y-4 sm:space-y-6">
                  <div className="space-y-1 sm:space-y-2">
                    <label htmlFor="oilAmount" className="font-medium">
                      Huile moteur (litres)
                    </label>
                    <input
                      id="oilAmount"
                      type="text"
                      name="oilAmount"
                      value={formData.oilAmount}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <label className="font-medium flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-indigo-500" />
                      <span>Filtres</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="oilFilter"
                          name="oilFilter"
                          checked={formData.oilFilter}
                          disabled
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
                        />
                        <label htmlFor="oilFilter" className="text-sm">
                          Huile
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="airFilter"
                          name="airFilter"
                          checked={formData.airFilter}
                          disabled
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
                        />
                        <label htmlFor="airFilter" className="text-sm">
                          Air
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="fuelFilter"
                          name="fuelFilter"
                          checked={formData.fuelFilter}
                          disabled
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
                        />
                        <label htmlFor="fuelFilter" className="text-sm">
                          Carburant
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="cabinFilter"
                          name="cabinFilter"
                          checked={formData.cabinFilter}
                          disabled
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
                        />
                        <label htmlFor="cabinFilter" className="text-sm">
                          Habitacle
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Maintenance */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <RotateCw className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-base sm:text-lg font-semibold">Autres interventions</h2>
                  </div>
                </div>
                <div className="p-3 sm:p-5 space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg">
                    <label htmlFor="fluidTopUp" className="font-medium">
                      Appoints fluides
                    </label>
                    <input
                      type="checkbox"
                      id="fluidTopUp"
                      name="fluidTopUp"
                      checked={formData.fluidTopUp}
                      disabled
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg">
                    <label htmlFor="wheelRotation" className="font-medium">
                      Rotation roues
                    </label>
                    <input
                      type="checkbox"
                      id="wheelRotation"
                      name="wheelRotation"
                      checked={formData.wheelRotation}
                      disabled
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Repairs Section */}
          <div id="repairs" className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-base sm:text-lg font-semibold">Réparations</h2>
                </div>
              </div>
              <div className="p-3 sm:p-5">
                <div className="space-y-2 sm:space-y-3">
                  {formData.repairs.length > 0 ? (
                    formData.repairs.map((repair, index) => (
                      <div key={`repair-${index}`} className="flex items-center space-x-2">
                        <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={repair}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucune réparation enregistrée.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Observations Section */}
          <div id="observations" className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-base sm:text-lg font-semibold">Observations</h2>
                </div>
              </div>
              <div className="p-3 sm:p-5">
                <div className="space-y-2 sm:space-y-3">
                  {formData.observations.length > 0 ? (
                    formData.observations.map((observation, index) => (
                      <div key={`observation-${index}`} className="flex items-center space-x-2">
                        <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={observation}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucune observation enregistrée.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-base sm:text-lg font-semibold">Employé</h2>
                </div>
              </div>
              <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                <div className="h-16 sm:h-24 border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                  <PenTool className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400 mr-2" />
                  <p className="text-slate-400 text-xs sm:text-sm">Signature de l'employé</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label htmlFor="employeeSignatureDate" className="font-medium">
                    Date
                  </label>
                  <input
                    id="employeeSignatureDate"
                    type="date"
                    name="employeeSignatureDate"
                    value={formData.employeeSignatureDate}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-base sm:text-lg font-semibold">Garagiste</h2>
                </div>
              </div>
              <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                <div className="h-16 sm:h-24 border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                  <PenTool className="h-4 sm:h-5 w-4 sm:w-5 text-slate-400 mr-2" />
                  <p className="text-slate-400 text-xs sm:text-sm">Signature du garagiste</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label htmlFor="mechanicSignatureDate" className="font-medium">
                    Date
                  </label>
                  <input
                    id="mechanicSignatureDate"
                    type="date"
                    name="mechanicSignatureDate"
                    value={formData.mechanicSignatureDate}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center md:justify-end mt-6 md:mt-8 space-x-4">
            <button
              onClick={() => navigate("/archiveFicheIntervention")}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-all"
            >
              Retour à l'historique
            </button>
            {/* Afficher le bouton Supprimer uniquement si l'utilisateur a la permission */}
            {hasPermission("FicheInterventions", "supprimer") && (
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

export default ViewRepairIntervention;