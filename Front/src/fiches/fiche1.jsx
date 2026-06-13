import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import usePermissions from "../hooks/usePermissions";

const API_BASE_URL = "http://localhost:5000/api";

export default function FicheReparation() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    maintenanceId: "",
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
    repairs: ["", "", ""],
    observations: ["", ""],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Pré-remplir le formulaire avec les données de location.state
  useEffect(() => {
    if (permissionsLoading) return;

    if (!hasPermission("FicheInterventions", "creer")) {
      toast.error("Vous n'avez pas la permission de créer une fiche d'intervention.", {
        position: "top-right",
        autoClose: 5000,
      });
      navigate("/ScheduleMaintenance");
      return;
    }

    if (location.state) {
      const { maintenanceId, vehicle, mechanic, date, time } = location.state;
      setFormData((prev) => ({
        ...prev,
        maintenanceId: maintenanceId || "",
        date: date || "",
        time: time || "",
        mechanic: mechanic ? `${mechanic.nom} ${mechanic.prenom}` : "",
        carMake: vehicle ? `${vehicle.marque} ${vehicle.modele}` : "",
        licensePlate: vehicle?.immatriculation || "",
        mileage: vehicle?.kilometrage ? vehicle.kilometrage.toString() : "",
      }));
    } else {
      console.warn("No location state provided");
      toast.warn("Aucune donnée de maintenance fournie. Veuillez sélectionner une maintenance.", {
        position: "top-right",
        autoClose: 5000,
      });
      navigate("/ScheduleMaintenance");
    }
  }, [location.state, hasPermission, permissionsLoading, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleArrayChange = (e, index, field) => {
    const newArray = [...formData[field]];
    newArray[index] = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: newArray,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    const requiredFields = [
      { key: "maintenanceId", label: "ID de maintenance" },
      { key: "date", label: "Date" },
      { key: "time", label: "Heure" },
      { key: "mechanic", label: "Garagiste" },
      { key: "carMake", label: "Marque/Modèle" },
      { key: "licensePlate", label: "Immatriculation" },
      { key: "mileage", label: "Kilométrage" },
    ];

    for (const field of requiredFields) {
      if (!formData[field.key]) {
        toast.error(`Le champ ${field.label} est requis.`, {
          position: "top-right",
          autoClose: 5000,
        });
        setIsLoading(false);
        return;
      }
    }

    if (isNaN(formData.mileage) || Number(formData.mileage) < 0) {
      toast.error("Le kilométrage doit être un nombre positif.", {
        position: "top-right",
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    }

    const cleanedFormData = {
      ...formData,
      mileage: Number(formData.mileage),
      repairs: formData.repairs.filter((repair) => repair.trim()),
      observations: formData.observations.filter((obs) => obs.trim()),
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté pour soumettre une intervention.", {
          position: "top-right",
          autoClose: 5000,
        });
        navigate("/login");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/repair-interventions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedFormData),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Intervention enregistrée avec succès !", {
          position: "top-right",
          autoClose: 2000,
          onClose: () => navigate("/ScheduleMaintenance"),
        });
        setFormData({
          maintenanceId: "",
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
          repairs: ["", "", ""],
          observations: ["", ""],
        });
      } else {
        console.error("Error submitting form:", result.error);
        toast.error(`Erreur: ${result.error}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Erreur réseau, veuillez réessayer.", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (permissionsLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement des permissions...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 sm:py-6 md:py-10 px-2 sm:px-4">
      <div className="max-w-5xl mx-auto border-none shadow-xl overflow-hidden rounded-lg bg-white">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 text-white py-4 sm:py-6 md:py-8 px-4 sm:px-6">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3">
            <Wrench className="h-6 w-6 sm:h-8 sm:w-8" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-center">
              FICHE D'INTERVENTION ATELIER
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
                  <label htmlFor="mechanic" className="font-medium">
                    Garagiste
                  </label>
                </div>
                <input
                  id="mechanic"
                  type="text"
                  name="mechanic"
                  value={formData.mechanic}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
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
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex space-x-1 whitespace-nowrap">
                <button
                  type="button"
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-100 rounded-t-lg border-b-2 border-indigo-500"
                  onClick={() => document.getElementById("maintenance").scrollIntoView({ behavior: "smooth" })}
                >
                  Maintenance
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                  onClick={() => document.getElementById("repairs").scrollIntoView({ behavior: "smooth" })}
                >
                  Réparations
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-t-lg"
                  onClick={() => document.getElementById("observations").scrollIntoView({ behavior: "smooth" })}
                >
                  Observations
                </button>
              </div>
            </div>

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
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                    <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <label htmlFor="fluidTopUp" className="font-medium cursor-pointer">
                        Appoints fluides
                      </label>
                      <input
                        type="checkbox"
                        id="fluidTopUp"
                        name="fluidTopUp"
                        checked={formData.fluidTopUp}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <label htmlFor="wheelRotation" className="font-medium cursor-pointer">
                        Rotation roues
                      </label>
                      <input
                        type="checkbox"
                        id="wheelRotation"
                        name="wheelRotation"
                        checked={formData.wheelRotation}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                    {formData.repairs.map((repair, index) => (
                      <div key={`repair-${index}`} className="flex items-center space-x-2">
                        <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={repair}
                          onChange={(e) => handleArrayChange(e, index, "repairs")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder={`Réparation ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                    {formData.observations.map((observation, index) => (
                      <div key={`observation-${index}`} className="flex items-center space-x-2">
                        <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={observation}
                          onChange={(e) => handleArrayChange(e, index, "observations")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder={`Observation ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center md:justify-end mt-6 md:mt-8">
              <button
                type="submit"
                disabled={isLoading || permissionsLoading}
                className={`w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 text-white text-base sm:text-lg font-bold rounded-lg shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all transform ${
                  isLoading || permissionsLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Enregistrement..." : "Enregistrer l'intervention"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}