import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { faExclamationTriangle, faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';
import usePermissions from '../../hooks/usePermissions';

const MySwal = withReactContent(Swal);
const API_BASE_URL = 'http://localhost:5000/api';


const renderTableCell = (value, type = 'text', fieldName = '') => {
  if (value === undefined || value === null || value === '') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-400">—</span>
        <span className="text-gray-400 text-xs" title={`${fieldName} non renseigné`}>
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-gray-300 hover:text-gray-500 cursor-help" />
        </span>
      </div>
    );
  }
  return value;
};

const request = async (method, url, data = null, headers = {}) => {
  try {
    const config = { method, url, headers, data };
    return await axios(config);
  } catch (error) {
    console.error("API Request Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config
    });
    throw error;
  }
};

export default function DriverTable() {
  const location = useLocation();
  const ViewAll = location.pathname === "/Travailleurs-chauffeurs";
  const { permissions, loading, error, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState({
    nom: '',
    prenom: '',
    email: '',
    age: '',
    telephone: '',
    experience: '',
    disponibilite: true,
    permisRecto: null,
    permisVerso: null,
    permisRectoUrl: '',
    permisVersoUrl: ''
  });
  const [showAddDriverForm, setShowAddDriverForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const driversPerPage = ViewAll ? 5 : 10;
  const [drivers, setDrivers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState({ recto: '', verso: '' });

  useEffect(() => {
    if (!hasPermission('conducteurs', 'lire')) return;
    fetchDrivers();
  }, [hasPermission]);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/drivers`, { headers });
      let driversData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      if (!Array.isArray(driversData)) {
        console.warn('fetchDrivers: response.data is not an array', driversData);
        driversData = [];
      }
      setDrivers(driversData);
    } catch (error) {
      console.error("Erreur lors de la récupération des conducteurs:", error.response?.data || error);
      toast.error("Erreur lors de la récupération des conducteurs.");
    } finally {
      setIsLoading(false);
    }
  };
  const filteredDrivers = drivers.filter((driver) =>
    driver.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.nom?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDrivers.length / driversPerPage);
  const indexOfLastDriver = currentPage * driversPerPage;
  const indexOfFirstDriver = indexOfLastDriver - driversPerPage;
  const currentDrivers = filteredDrivers.slice(indexOfFirstDriver, indexOfLastDriver);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleAddDriver = () => {
    if (!hasPermission('conducteurs', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un conducteur.");
      return;
    }
    setShowAddDriverForm(true);
    setSelectedDriver({
      nom: '',
      prenom: '',
      email: '',
      age: '',
      telephone: '',
      experience: '',
      disponibilite: true,
      permisRecto: null,
      permisVerso: null,
      permisRectoUrl: '',
      permisVersoUrl: ''
    });
  };

  const handleEditDriver = (driver) => {
    if (!hasPermission('conducteurs', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un conducteur.");
      return;
    }
    setSelectedDriver({
      ...driver,
      age: driver.age?.toString() || '',
      experience: driver.experience?.toString() || '',
      disponibilite: driver.disponibilite === true,
      permisRecto: null,
      permisVerso: null,
      permisRectoUrl: driver.permisRectoUrl || '',
      permisVersoUrl: driver.permisVersoUrl || ''
    });
    setShowAddDriverForm(true);
  };

  const handleTableDriver = () => {
    setShowAddDriverForm(false);
    setSelectedDriver({
      nom: '',
      prenom: '',
      email: '',
      age: '',
      telephone: '',
      experience: '',
      disponibilite: true,
      permisRecto: null,
      permisVerso: null,
      permisRectoUrl: '',
      permisVersoUrl: ''
    });
  };

  const validateDriverData = () => {
    if (!selectedDriver.nom?.trim()) {
      toast.error("Le nom est requis");
      return false;
    }
    if (!selectedDriver.prenom?.trim()) {
      toast.error("Le prénom est requis");
      return false;
    }
    if (!selectedDriver.email?.trim()) {
      toast.error("L'email est requis");
      return false;
    }
    if (!selectedDriver.telephone?.trim()) {
      toast.error("Le numéro de téléphone est requis");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(selectedDriver.email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return false;
    }

    const age = parseInt(selectedDriver.age);
    if (isNaN(age) || age < 18) {
      toast.error("L'âge doit être un nombre valide (minimum 18 ans)");
      return false;
    }

    const experience = parseInt(selectedDriver.experience);
    if (isNaN(experience) || experience < 0) {
      toast.error("L'expérience doit être un nombre valide");
      return false;
    }

    const phoneRegex = /^[24579]\d{7}$/;
    if (!phoneRegex.test(selectedDriver.telephone)) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return false;
    }

    if (!selectedDriver._id) {
      if (!selectedDriver.permisRecto) {
        toast.error("Le recto du permis est requis");
        return false;
      }
      if (!selectedDriver.permisVerso) {
        toast.error("Le verso du permis est requis");
        return false;
      }
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedDriver.permisRecto) {
      if (!validTypes.includes(selectedDriver.permisRecto.type)) {
        toast.error("Le recto du permis doit être une image PNG, JPEG ou JPG");
        return false;
      }
      if (selectedDriver.permisRecto.size > maxSize) {
        toast.error("Le recto du permis ne doit pas dépasser 5 Mo");
        return false;
      }
    }
    if (selectedDriver.permisVerso) {
      if (!validTypes.includes(selectedDriver.permisVerso.type)) {
        toast.error("Le verso du permis doit être une image PNG, JPEG ou JPG");
        return false;
      }
      if (selectedDriver.permisVerso.size > maxSize) {
        toast.error("Le verso du permis ne doit pas dépasser 5 Mo");
        return false;
      }
    }

    return true;
  };

  const handleAddDriverSuccess = async () => {
    if (!validateDriverData()) return;

    const isEdit = Boolean(selectedDriver._id);
    if (isEdit && !hasPermission('conducteurs', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un conducteur.");
      return;
    }
    if (!isEdit && !hasPermission('conducteurs', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un conducteur.");
      return;
    }

    const confirmationMessage = isEdit
      ? "Êtes-vous sûr de vouloir modifier ce Conducteur ?"
      : "Êtes-vous sûr de vouloir ajouter ce Conducteur ?";
    const actionTitle = isEdit ? "Modifier Conducteur" : "Ajouter Conducteur";

    const result = await MySwal.fire({
      title: `Confirmer ${isEdit ? "la modification" : "l'ajout"}`,
      text: confirmationMessage,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, confirmer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("nom", selectedDriver.nom.trim());
      formData.append("prenom", selectedDriver.prenom.trim());
      formData.append("email", selectedDriver.email.trim());
      formData.append("telephone", selectedDriver.telephone.trim());
      formData.append("experience", parseInt(selectedDriver.experience));
      formData.append("age", parseInt(selectedDriver.age));
      formData.append("disponibilite", Boolean(selectedDriver.disponibilite));

      if (selectedDriver.permisRecto) {
        formData.append("permisRecto", selectedDriver.permisRecto);
      }
      if (selectedDriver.permisVerso) {
        formData.append("permisVerso", selectedDriver.permisVerso);
      }

      let response;
      if (isEdit) {
        response = await request("put", `${API_BASE_URL}/drivers/${selectedDriver._id}`, formData);
      } else {
        response = await request("post", `${API_BASE_URL}/drivers`, formData);
      }

      await Swal.fire({
        title: `${actionTitle} réussie`,
        text: `Conducteur ${isEdit ? "modifié" : "ajouté"} avec succès!`,
        icon: "success",
      });

      setShowAddDriverForm(false);
      setSelectedDriver({
        nom: '',
        prenom: '',
        email: '',
        age: '',
        telephone: '',
        experience: '',
        disponibilite: true,
        permisRecto: null,
        permisVerso: null,
        permisRectoUrl: '',
        permisVersoUrl: ''
      });
      fetchDrivers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue lors de l'ajout du conducteur";
      toast.error(`Erreur: ${errorMessage}`);
      console.error("Erreur détaillée:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupprimer = async (driverId) => {
    if (!hasPermission('conducteurs', 'supprimer')) {
      toast.error("Vous n'avez pas la permission de supprimer un conducteur.");
      return;
    }

    const result = await MySwal.fire({
      title: "Confirmer la suppression",
      text: "Êtes-vous sûr de vouloir supprimer ce Conducteur ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      await request("delete", `${API_BASE_URL}/drivers/${driverId}`);
      await Swal.fire({
        title: "Suppression réussie",
        text: "Conducteur supprimé avec succès!",
        icon: "success",
      });
      fetchDrivers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue";
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openImageModal = ({ recto, verso }) => {
    setModalImage({ recto: recto || '', verso: verso || '' });
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    setModalImage({ recto: '', verso: '' });
    document.body.style.overflow = 'auto';
  };

  const renderAddDriverForm = () => (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        {selectedDriver._id ? "Modifier Conducteur" : "Ajouter Nouveau Conducteur"}
      </h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddDriverSuccess();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedDriver({ ...selectedDriver, nom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer nom"
              value={selectedDriver.nom || ""}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedDriver({ ...selectedDriver, prenom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer prénom"
              value={selectedDriver.prenom || ""}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Adresse Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer email"
              onChange={(e) => setSelectedDriver({ ...selectedDriver, email: e.target.value })}
              value={selectedDriver.email || ""}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Âge <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              onChange={(e) => setSelectedDriver({ ...selectedDriver, age: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer âge"
              value={selectedDriver.age || ""}
              min="18"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedDriver({ ...selectedDriver, telephone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer téléphone"
              value={selectedDriver.telephone || ""}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Expérience (années) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              onChange={(e) => setSelectedDriver({ ...selectedDriver, experience: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Années d'expérience"
              value={selectedDriver.experience || ""}
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Disponibilité <span className="text-red-500">*</span>
            </label>
            <select
              onChange={(e) => setSelectedDriver({ ...selectedDriver, disponibilite: e.target.value === "true" })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              value={String(selectedDriver.disponibilite)}
              required
            >
              <option value="true">Disponible</option>
              <option value="false">Occupé</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Permis Recto {selectedDriver._id ? "" : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="file"
                id="permisRecto"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => setSelectedDriver({ ...selectedDriver, permisRecto: e.target.files[0] })}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white text-gray-500 hover:bg-gray-50 transition duration-150 ease-in-out">
                <span>{selectedDriver.permisRecto ? selectedDriver.permisRecto.name : "Choisir une image"}</span>
                <span className="text-blue-600 font-semibold">Parcourir</span>
              </div>
            </div>
            {selectedDriver._id && selectedDriver.permisRectoUrl && !selectedDriver.permisRecto && (
              <img src={selectedDriver.permisRectoUrl} alt="Permis Recto" className="mt-2 w-32 h-20 object-cover rounded" />
            )}
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Permis Verso {selectedDriver._id ? "" : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="file"
                id="permisVerso"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => setSelectedDriver({ ...selectedDriver, permisVerso: e.target.files[0] })}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white text-gray-500 hover:bg-gray-50 transition duration-150 ease-in-out">
                <span>{selectedDriver.permisVerso ? selectedDriver.permisVerso.name : "Choisir une image"}</span>
                <span className="text-blue-600 font-semibold">Parcourir</span>
              </div>
            </div>
            {selectedDriver._id && selectedDriver.permisVersoUrl && !selectedDriver.permisVerso && (
              <img src={selectedDriver.permisVersoUrl} alt="Permis Verso" className="mt-2 w-32 h-20 object-cover rounded" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            type="submit"
            className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : (selectedDriver._id ? "Modifier Conducteur" : "Ajouter Conducteur")}
          </button>
          <button
            onClick={handleTableDriver}
            type="button"
            className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 w-full"
            disabled={isLoading}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Chargement des permissions...</div>;
  if (!hasPermission('conducteurs', 'lire')) {
    return (
      <div className="p-8 text-center text-red-600">
        Vous n'avez pas la permission de voir la liste des conducteurs.
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen transition-all duration-300 ${isModalOpen ? 'overflow-hidden' : ''}`}>
      {/* Dashboard Content */}
      <div className={`transition-all duration-300 ${isModalOpen ? 'filter blur-md' : ''}`}>
        <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          {showAddDriverForm ? (
            renderAddDriverForm()
          ) : (
            <>
              <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Liste des conducteurs</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-200">Voir les informations sur tous les conducteurs</p>
                </div>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Rechercher"
                    className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {hasPermission('conducteurs', 'creer') && (
                    <button onClick={handleAddDriver} className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition duration-300">
                      AJOUTER UN CONDUCTEUR
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col mt-6">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th scope="col" className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              NOM & PRÉNOM
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              EMAIL
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              ÂGE
                            </th>
                            <th scope="col" className="px-12 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              DISPONIBILITÉ
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              TÉLÉPHONE
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              EXPÉRIENCE
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              GROUPE ASSIGNÉ
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              VÉHICULE ASSIGNÉ
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400">
                              PERMIS
                            </th>
                            <th scope="col" className="relative py-3.5 px-4">
                              <span className="font-normal">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
  {currentDrivers.length > 0 ? (
    currentDrivers.map((driver, index) => (
      <tr key={index}>
        <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
          <div className="inline-flex items-center gap-x-3">
            <div className="flex items-center gap-x-2">
              <div>
                <h2 className="font-medium text-gray-800 dark:text-white">{driver.prenom + " " + driver.nom}</h2>
                <p className="text-sm font-normal text-gray-600 dark:text-gray-400">#chauf{driver._id.substring(0, 5)}</p>
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">{driver.email}</td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">{driver.age}</td>
        <td className="px-12 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
          <div className={`inline-flex items-center px-3 py-1 rounded-full gap-x-2 ${driver.disponibilite ? "bg-emerald-100/60" : "bg-red-100/60"} dark:bg-gray-800`}>
            <span className={`h-1.5 w-1.5 rounded-full ${driver.disponibilite ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <h2 className={`text-sm font-normal ${driver.disponibilite ? 'text-emerald-500' : 'text-red-500'}`}>
              {driver.disponibilite ? "DISPONIBLE" : "OCCUPÉ"}
            </h2>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">{driver.telephone}</td>
        <td className="px-4 py-4 text-sm whitespace-nowrap">
          <div className="flex items-center gap-x-2">
            <p className="px-4 py-1 text-xs text-indigo-500 rounded-full dark:bg-gray-800 bg-indigo-100/60">{driver.experience} ans</p>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
          {renderTableCell(
            driver.vehicles?.[0]?.proprietaire?.nom,
            'text',
            'Groupe Assigné'
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
          {renderTableCell(
            driver.vehicles?.[0] ? `${driver.vehicles[0].marque} ${driver.vehicles[0].modele}` : null,
            'text',
            'Véhicule Assigné'
          )}
        </td>
        <td className="px-6 py-4 text-sm whitespace-nowrap">
          {(driver.permisRectoUrl || driver.permisVersoUrl) ? (
            <button
              onClick={() => openImageModal({ recto: driver.permisRectoUrl, verso: driver.permisVersoUrl })}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Voir les permis (recto et verso)"
            >
              <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
            </button>
          ) : (
            <span className="text-gray-500">Aucun permis</span>
          )}
        </td>
        <td className="px-4 py-4 text-sm whitespace-nowrap">
          <div className="flex items-center gap-x-6">
            {hasPermission('conducteurs', 'supprimer') && (
              <button onClick={() => handleSupprimer(driver._id)} className="text-gray-500 transition-colors duration-200 dark:hover:text-red-500 dark:text-gray-300 hover:text-red-500 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
            {hasPermission('conducteurs', 'modifier') && (
              <button onClick={() => handleEditDriver(driver)} className="text-gray-500 transition-colors duration-200 dark:hover:text-yellow-500 dark:text-gray-300 hover:text-yellow-500 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
            )}
          </div>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="10" className="text-center py-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl" />
          <p className="text-gray-600 text-lg">Aucun conducteur trouvé.</p>
        </div>
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
                  className="px-4 dark:text-gray-200 py-2 rounded-md border text-gray-600 hover:bg-gray-300 transition duration-300"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  SUIVANTE <span className="ml-2">→</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal for Image Preview */}
      {isModalOpen && (
  <>
    {/* Overlay flouté */}
    <div className="fixed inset-0 z-40 backdrop-blur-md backdrop-brightness-90 transition-opacity duration-300"></div>
    
    {/* Modal */}
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-2xl transform transition-all duration-300 ease-in-out opacity-100 scale-100 animate-modal-open">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h3 className="text-xl font-semibold text-gray-800">Aperçu des permis</h3>
          <button 
            onClick={closeImageModal} 
            className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modalImage.recto ? (
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Permis Recto</h4>
              <div className="flex justify-center items-center w-full h-[300px] bg-gray-100 rounded-lg border border-gray-200">
                <img 
                  src={modalImage.recto} 
                  alt="Permis Recto" 
                  className="max-w-full max-h-full object-contain rounded-lg" 
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <span>Aucun recto disponible</span>
            </div>
          )}
          {modalImage.verso ? (
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Permis Verso</h4>
              <div className="flex justify-center items-center w-full h-[300px] bg-gray-100 rounded-lg border border-gray-200">
                <img 
                  src={modalImage.verso} 
                  alt="Permis Verso" 
                  className="max-w-full max-h-full object-contain rounded-lg" 
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <span>Aucun verso disponible</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
)}

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

// Ajouter une animation personnalisée avec Tailwind via une balise <style>
const styles = `
  @keyframes modalOpen {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .animate-modal-open {
    animation: modalOpen 0.3s ease-out forwards;
  }
`;
document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);