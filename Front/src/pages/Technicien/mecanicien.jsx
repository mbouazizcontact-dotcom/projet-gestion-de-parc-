import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';
import usePermissions from '../../hooks/usePermissions';

const MySwal = withReactContent(Swal);
const API_BASE_URL = 'http://localhost:5000/api';

const request = async (method, url, data = null, headers = {}) => {
  try {
    const config = { method, url, headers, data };
    return await axios(config);
  } catch (error) {
    throw error;
  }
};

export default function MechanicTable() {
  const location = useLocation();
  const navigate = useNavigate();
  const ViewAll = location.pathname === '/Travailleurs-mecaniciens';
  const { permissions, loading, error, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGarage, setFilterGarage] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMechanic, setSelectedMechanic] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    experience: '',
    specialisation: '',
    dateEmboche: '',
    statut: 'Disponible',
    garage: '',
  });
  const [showAddMechanicForm, setShowAddMechanicForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mechanics, setMechanics] = useState([]);
  const [garages, setGarages] = useState([]);
  const mechanicsPerPage = ViewAll ? 5 : 10;

  useEffect(() => {
    if (!hasPermission('mecaniciens', 'lire')) return;
    fetchMechanics();
    fetchGarages();
  }, [hasPermission]);

  const fetchMechanics = async () => {
    try {
      setIsLoading(true);
      const query = filterGarage ? `?garage=${filterGarage}` : '';
      const response = await axios.get(`${API_BASE_URL}/mecaniciens${query}`);
      setMechanics(response.data);
    } catch (error) {
      toast.error('Erreur lors de la récupération des mécaniciens.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGarages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/garages`);
      setGarages(response.data);
    } catch (error) {
      toast.error('Erreur lors de la récupération des garages.');
    }
  };

  useEffect(() => {
    fetchMechanics(); // Re-fetch mechanics when filterGarage changes
  }, [filterGarage]);

  const filteredMechanics = mechanics.filter(
    (mechanic) =>
      (mechanic.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mechanic.nom?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!filterGarage || mechanic.garage?._id === filterGarage)
  );



  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const totalPages = Math.ceil(filteredMechanics.length / mechanicsPerPage);
  const indexOfLastMechanic = currentPage * mechanicsPerPage;
  const indexOfFirstMechanic = indexOfLastMechanic - mechanicsPerPage;
  const currentMechanics = filteredMechanics.slice(indexOfFirstMechanic, indexOfLastMechanic);
  const handleAddMechanic = () => {
    if (!hasPermission('mecaniciens', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un mécanicien");
      return;
    }
    navigate('/utulisateurs', { state: { role: 'Mécanicien' } });
  };

  const handleEditMechanic = (mechanic) => {
    if (!hasPermission('mecaniciens', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un mécanicien.");
      return;
    }
    setSelectedMechanic({
      ...mechanic,
      experience: mechanic.experience?.toString() || '',
      dateEmboche: mechanic.dateEmboche ? new Date(mechanic.dateEmboche).toISOString().split('T')[0] : '',
      garage: mechanic.garage?._id || mechanic.garage || '',
    });
    setShowAddMechanicForm(true);
  };

  const handleTableMechanic = () => {
    setShowAddMechanicForm(false);
    setSelectedMechanic({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      experience: '',
      specialisation: '',
      dateEmboche: '',
      statut: 'Disponible',
      garage: '',
    });
  };

 const validateMechanicData = () => {
  if (!selectedMechanic.nom?.trim()) {
    toast.error('Le nom est requis');
    return false;
  }
  if (!selectedMechanic.prenom?.trim()) {
    toast.error('Le prénom est requis');
    return false;
  }
  if (!selectedMechanic.email?.trim()) {
    toast.error("L'email est requis");
    return false;
  }
  if (!selectedMechanic.telephone?.trim()) {
    toast.error('Le numéro de téléphone est requis');
    return false;
  }
  if (!selectedMechanic.specialisation?.trim()) {
    toast.error('La spécialisation est requise');
    return false;
  }
  if (!selectedMechanic.garage) {
    toast.error('Le garage est requis');
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(selectedMechanic.email)) {
    toast.error('Veuillez entrer une adresse email valide');
    return false;
  }

  const phoneRegex = /^\d{8}$/;
  if (!phoneRegex.test(selectedMechanic.telephone)) {
    toast.error('Le numéro de téléphone doit comporter 8 chiffres');
    return false;
  }

  const experience = parseInt(selectedMechanic.experience);
  if (isNaN(experience) || experience < 0 || experience > 50) {
    toast.error("L'expérience doit être un nombre entre 0 et 50");
    return false;
  }

  if (!selectedMechanic.dateEmboche) {
    toast.error("La date d'embauche est requise");
    return false;
  }

  const hireDate = new Date(selectedMechanic.dateEmboche);
  if (isNaN(hireDate.getTime())) {
    toast.error("La date d'embauche est invalide");
    return false;
  }

  // New validation: Ensure hire date is not in the future
  const currentDate = new Date();
  // Set currentDate to midnight to compare only dates, ignoring time
  currentDate.setHours(0, 0, 0, 0);
  hireDate.setHours(0, 0, 0, 0);
  if (hireDate > currentDate) {
    toast.error("La date d'embauche ne peut pas être ultérieure à la date actuelle.");
    return false;
  }

  return true;
};

  const handleAddMechanicSuccess = async () => {
    if (!validateMechanicData()) return;

    const isEdit = Boolean(selectedMechanic._id);
    if (isEdit && !hasPermission('mecaniciens', 'modifier')) {
      toast.error("Vous n'avez pas la permission de modifier un mécanicien.");
      return;
    }
    if (!isEdit && !hasPermission('mecaniciens', 'creer')) {
      toast.error("Vous n'avez pas la permission d'ajouter un mécanicien.");
      return;
    }

    const confirmationMessage = isEdit ? 'Êtes-vous sûr de vouloir modifier ce mécanicien ?' : 'Êtes-vous sûr de vouloir ajouter ce mécanicien ?';
    const actionTitle = isEdit ? 'Modifier Mécanicien' : 'Ajouter Mécanicien';

    const result = await MySwal.fire({
      title: `Confirmer ${isEdit ? 'la modification' : "l'ajout"}`,
      text: confirmationMessage,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler',
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      const mechanicData = {
        nom: selectedMechanic.nom.trim(),
        prenom: selectedMechanic.prenom.trim(),
        email: selectedMechanic.email.trim(),
        telephone: selectedMechanic.telephone.trim(),
        experience: parseInt(selectedMechanic.experience),
        specialisation: selectedMechanic.specialisation.trim(),
        dateEmboche: new Date(selectedMechanic.dateEmboche),
        statut: selectedMechanic.statut,
        garage: selectedMechanic.garage,
      };

      console.log('Sending mechanic data:', mechanicData); // Debug log

      let response;
      if (isEdit) {
        response = await request('put', `${API_BASE_URL}/mecaniciens/${selectedMechanic._id}`, mechanicData);
      } else {
        response = await request('post', `${API_BASE_URL}/mecaniciens`, mechanicData);
      }

      await Swal.fire({
        title: `${actionTitle} réussie`,
        text: `Mécanicien ${isEdit ? 'modifié' : 'ajouté'} avec succès!`,
        icon: 'success',
      });

      setShowAddMechanicForm(false);
      setSelectedMechanic({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        experience: '',
        specialisation: '',
        dateEmboche: '',
        statut: 'Disponible',
        garage: '',
      });
      fetchMechanics();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Une erreur est survenue';
      toast.error(`Erreur: ${errorMessage}`);
      console.error('Detailed Error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupprimer = async (mechanicId) => {
    if (!hasPermission('mecaniciens', 'supprimer')) {
      toast.error("Vous n'avez pas la permission de supprimer un mécanicien.");
      return;
    }

    const result = await MySwal.fire({
      title: 'Confirmer la suppression',
      text: 'Êtes-vous sûr de vouloir supprimer ce mécanicien ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      await request('delete', `${API_BASE_URL}/mecaniciens/${mechanicId}`);
      await Swal.fire({
        title: 'Suppression réussie',
        text: 'Mécanicien supprimé avec succès!',
        icon: 'success',
      });
      fetchMechanics();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Une erreur est survenue';
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAddMechanicForm = () => (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        {selectedMechanic._id ? 'Modifier Mécanicien' : 'Ajouter Nouveau Mécanicien'}
      </h2>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddMechanicSuccess();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedMechanic({ ...selectedMechanic, nom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer nom"
              value={selectedMechanic.nom || ''}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedMechanic({ ...selectedMechanic, prenom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer prénom"
              value={selectedMechanic.prenom || ''}
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
              onChange={(e) => setSelectedMechanic({ ...selectedMechanic, email: e.target.value })}
              value={selectedMechanic.email || ''}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedMechanic({ ...selectedMechanic, telephone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer téléphone"
              value={selectedMechanic.telephone || ''}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Expérience (années) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              onChange={(e) => setSelectedMechanic({ ...selectedMechanic, experience: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Années d'expérience"
              value={selectedMechanic.experience || ''}
              required
              min="0"
              max="50"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Spécialisation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              onChange={(e) => setSelectedMechanic({ ...selectedMechanic, specialisation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Entrer spécialisation"
              value={selectedMechanic.specialisation || ''}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Date d'embauche <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              onChange={(e) => setSelectedMechanic({ ...selectedMechanic, dateEmboche: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              value={selectedMechanic.dateEmboche || ''}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Statut <span className="text-red-500">*</span>
            </label>
            <select
              onChange={(e) => setSelectedMechanic({ ...selectedMechanic, statut: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              value={selectedMechanic.statut}
              required
            >
              <option value="Disponible">Disponible</option>
              <option value="Occupé">Occupé</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Garage <span className="text-red-500">*</span>
            </label>
            <select
              onChange={(e) => setSelectedMechanic({ ...selectedMechanic, garage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              value={selectedMechanic.garage || ''}
              required
            >
              <option value="">Sélectionner un garage</option>
              {garages.map((garage) => (
                <option key={garage._id} value={garage._id}>
                  {garage.nom} ({garage.adresse})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            type="submit"
            className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 w-full ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : selectedMechanic._id ? 'Modifier Mécanicien' : 'Ajouter Mécanicien'}
          </button>
          <button
            onClick={handleTableMechanic}
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
  if (!hasPermission('mecaniciens', 'lire')) {
    return (
      <div className="p-8 text-center text-red-600">Vous n'avez pas la permission de voir la liste des mécaniciens.</div>
    );
  }

  return (
    <div className="relative min-h-screen transition-all duration-300">
      <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        {showAddMechanicForm ? (
          renderAddMechanicForm()
        ) : (
          <>
            <div className="flex justify-between items-center pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Liste des mécaniciens</h2>
                <p className="text-sm text-gray-500 dark:text-gray-200">Voir les informations sur tous les mécaniciens</p>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Rechercher par nom ou prénom"
                  className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  value={filterGarage}
                  onChange={(e) => setFilterGarage(e.target.value)}
                  className="border dark:text-gray-300 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les garages</option>
                  {garages.map((garage) => (
                    <option key={garage._id} value={garage._id}>
                      {garage.nom} ({garage.adresse})
                    </option>
                  ))}
                </select>
                {hasPermission('mecaniciens', 'creer') && (
                  <button
                    onClick={handleAddMechanic}
                    className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition duration-300"
                  >
                    AJOUTER UN MÉCANICIEN
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
                          <th
                            scope="col"
                            className="py-3.5 px-4 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            NOM & PRÉNOM
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            EMAIL
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            TÉLÉPHONE
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            EXPÉRIENCE
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            SPÉCIALISATION
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            DATE EMBAUCHE
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            GARAGE
                          </th>
                          <th
                            scope="col"
                            className="px-12 py-3.5 text-sm font-normal text-left text-gray-500 dark:text-gray-400"
                          >
                            STATUT
                          </th>
                          <th scope="col" className="relative py-3.5 px-4">
                            <span className="font-normal">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                        {currentMechanics.length > 0 ? (
                          currentMechanics.map((mechanic, index) => (
                            <tr key={index}>
                              <td className="px-4 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                <div className="inline-flex items-center gap-x-3">
                                  <div className="flex items-center gap-x-2">
                                    <div>
                                      <h2 className="font-medium text-gray-800 dark:text-white">
                                        { mechanic.nom}
                                      </h2>
                                      <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                        #mec{mechanic._id.substring(0, 5)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {mechanic.email}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {mechanic.telephone}
                              </td>
                              <td className="px-4 py-4 text-sm whitespace-nowrap">
                                <div className="flex items-center gap-x-2">
                                  <p className="px-4 py-1 text-xs text-indigo-500 rounded-full dark:bg-gray-800 bg-indigo-100/60">
                                    {mechanic.experience} ans
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {mechanic.specialisation}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {new Date(mechanic.dateEmboche).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                {mechanic.garage?.nom || 'N/A'} {mechanic.garage?.adresse ? `(${mechanic.garage.adresse})` : ''}
                              </td>
                              <td className="px-12 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                <div
                                  className={`inline-flex items-center px-3 py-1 rounded-full gap-x-2 ${
                                    mechanic.statut === 'Disponible' ? 'bg-emerald-100/60' : 'bg-red-100/60'
                                  } dark:bg-gray-800`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      mechanic.statut === 'Disponible' ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}
                                  ></span>
                                  <h2
                                    className={`text-sm font-normal ${
                                      mechanic.statut === 'Disponible' ? 'text-emerald-500' : 'text-red-500'
                                    }`}
                                  >
                                    {mechanic.statut}
                                  </h2>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm whitespace-nowrap">
                                <div className="flex items-center gap-x-6">
                                  {hasPermission('mecaniciens', 'supprimer') && (
                                    <button
                                      onClick={() => handleSupprimer(mechanic._id)}
                                      className="text-gray-500 transition-colors duration-200 dark:hover:text-red-500 dark:text-gray-300 hover:text-red-500 focus:outline-none"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                  {hasPermission('mecaniciens', 'modifier') && (
                                    <button
                                      onClick={() => handleEditMechanic(mechanic)}
                                      className="text-gray-500 transition-colors duration-200 dark:hover:text-yellow-500 dark:text-gray-300 hover:text-yellow-500 focus:outline-none"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-6">
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl" />
                                <p className="text-gray-600 text-lg">Aucun mécanicien trouvé.</p>
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
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}