import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API_BASE_URL = 'http://localhost:5000/api';

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
  } catch (err) {
    console.error("API Request Error:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
      config: err.config,
    });
    throw err;
  }
};

export default function CreateDemandePiece() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pieces: "",
    marque: "",
    modele: "",
    immatriculation: "",
    dateCommande: new Date().toISOString().split('T')[0],
  });
  const [mecaniciens, setMecaniciens] = useState([]);
  const [mecanicienSearch, setMecanicienSearch] = useState('');
  const [showMecanicienDropdown, setShowMecanicienDropdown] = useState(false);
  const [selectedMecanicien, setSelectedMecanicien] = useState(null);
  const mecanicienInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMecaniciens();
    // Fermer le dropdown en cliquant à l'extérieur
    const handleClickOutside = (event) => {
      if (mecanicienInputRef.current && !mecanicienInputRef.current.contains(event.target)) {
        setShowMecanicienDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchMecaniciens = async () => {
    try {
      const response = await request("get", "/mecaniciens");
      setMecaniciens(response.data);
    } catch (err) {
      toast.error("Erreur lors de la récupération des mécaniciens.");
    }
  };

  const filteredMecaniciens = mecaniciens.filter((mecanicien) => {
    const fullName = `${mecanicien.prenom} ${mecanicien.nom}`.toLowerCase();
    return fullName.includes(mecanicienSearch.toLowerCase());
  });

  const handleMecanicienSelect = (mecanicien) => {
    setSelectedMecanicien(mecanicien);
    setMecanicienSearch(`${mecanicien.prenom} ${mecanicien.nom}`);
    setShowMecanicienDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMecanicien) {
      toast.error("Veuillez sélectionner un mécanicien");
      return;
    }

    try {
      setIsLoading(true);
      const demandeData = {
        ...formData,
        demandeurId: selectedMecanicien._id,
        etat: "En cours",
      };

      await request("post", "/demandes/demandes", demandeData);
      toast.success("Demande créée avec succès");
      navigate("/demandes");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Une erreur est survenue lors de la création de la demande.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
        Ajouter une demande
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dateCommande"
              value={formData.dateCommande.slice(0, 10)}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative" ref={mecanicienInputRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Demandeur <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center relative">
              <input
                type="text"
                value={mecanicienSearch}
                onChange={e => {
                  setMecanicienSearch(e.target.value);
                  setShowMecanicienDropdown(true);
                }}
                onFocus={() => setShowMecanicienDropdown(true)}
                placeholder="Rechercher un mécanicien..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
                autoComplete="off"
                readOnly={false}
                style={{ cursor: "pointer" }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </span>
            </div>
            {showMecanicienDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredMecaniciens.length > 0 ? (
                  filteredMecaniciens.map((mecanicien) => (
                    <div
                      key={mecanicien._id}
                      onClick={() => handleMecanicienSelect(mecanicien)}
                      className={`px-4 py-2 hover:bg-blue-100 cursor-pointer ${
                        selectedMecanicien && selectedMecanicien._id === mecanicien._id
                          ? 'bg-blue-50 font-semibold'
                          : ''
                      }`}
                    >
                      {mecanicien.prenom} {mecanicien.nom}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-400">Aucun résultat</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Véhicule <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="marque"
            value={formData.marque}
            onChange={handleChange}
            required
            placeholder="Marque du véhicule"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <input
            type="text"
            name="modele"
            value={formData.modele}
            onChange={handleChange}
            required
            placeholder="Modèle du véhicule"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <input
            type="text"
            name="immatriculation"
            value={formData.immatriculation}
            onChange={handleChange}
            required
            placeholder="Immatriculation"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pièces <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pieces"
            value={formData.pieces}
            onChange={handleChange}
            required
            placeholder="Entrez les pièces demandées"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/demandes")}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? "Création en cours..." : "Créer Demande"}
          </button>
        </div>
      </form>
    </div>
  );
} 