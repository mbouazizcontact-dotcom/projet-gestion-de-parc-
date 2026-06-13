import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { CSVLink } from "react-csv";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";

const ViewAllAppareil = () => {
  const [actionMenuVisible, setActionMenuVisible] = useState({});
  const [filter, setFilter] = useState(''); // Filtrage par défaut sur vide
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const partsPerPage = 5;
  const [reparations, setReparations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActionMenuVisible({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchReparations();
  }, []);

  const fetchReparations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api');
      setReparations(response.data);
      setLoading(false);
    } catch (error) {
      toast.error("Erreur lors de la récupération des maintenances.");
      setLoading(false);
    }
  };

  const toggleActionMenu = (reparationId) => {
    setActionMenuVisible((prev) => ({
      ...prev,
      [reparationId]: !prev[reparationId]
    }));
  };
  const handleAction = (reparation, action) => {
    if (action === 'terminer') {
        Swal.fire({
            title: 'Finaliser la maintenance',
            html: `
            <form id="maintenanceForm" class="text-left">
                <div class="mb-3">
                    <label class="block text-gray-700 text-sm font-bold mb-1">ID</label>
                    <input type="text" id="maintenance-id" class="w-full px-3 py-2 border rounded-lg" value="${reparation?._id || ''}" readonly />
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 text-sm font-bold mb-1">Chauffeur</label>
                    <input type="text" id="maintenance-chauffeur" class="w-full px-3 py-2 border rounded-lg" value="${reparation?.chauffeur?.nom || ''}" readonly />
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 text-sm font-bold mb-1">Description</label>
                    <textarea id="maintenance-description" class="w-full px-3 py-2 border rounded-lg" rows="3">${reparation?.description || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 text-sm font-bold mb-1">Symptômes de la panne</label>
                    <textarea id="maintenance-symptomes" class="w-full px-3 py-2 border rounded-lg" rows="3" readonly>${reparation?.symptomes_panne || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 text-sm font-bold mb-1">Mécanicien</label>
                    <input type="text" id="maintenance-mecanicien" class="w-full px-3 py-2 border rounded-lg" value="${reparation?.mecanicien?.nom || ''}" readonly />
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 text-sm font-bold mb-1">Véhicule</label>
                    <input type="text" id="maintenance-vehicule" class="w-full px-3 py-2 border rounded-lg" value="${reparation?.vehicule?.immatriculation || ''}" readonly />
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 text-sm font-bold mb-1">Date Dépôt</label>
                    <input type="text" id="maintenance-date-depot" class="w-full px-3 py-2 border rounded-lg" value="${reparation?.dateDepot ? new Date(reparation.dateDepot).toLocaleDateString() : ''}" readonly />
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 text-sm font-bold mb-1">Date Fin Maintenance</label>
                    <input type="date" id="maintenance-date-fin" class="w-full px-3 py-2 border rounded-lg" value="${new Date().toISOString().split('T')[0]}" readonly />
                </div>
            </form>`,
            showCancelButton: true,
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            preConfirm: () => {
                return {
                    description: document.getElementById('maintenance-description').value,
                    symptomes: reparation?.symptomes_panne || '',  
                    date_fin_reparation: document.getElementById('maintenance-date-fin').value
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    console.log("Données de la réparation :", reparation);

                    if (!reparation?.chauffeur?._id || !reparation?.mecanicien?._id || !reparation?.vehicule?._id) {
                        toast.error("Données incomplètes, impossible d'ajouter à l'historique !");
                        return;
                    }

                    const maintenanceData = {
                        chauffeur: reparation.chauffeur._id,
                        description: result.value.description,
                        symptomes: reparation.symptomes_panne,  
                        mecanicien: reparation.mecanicien._id,
                        vehicule: reparation.vehicule._id,
                        dateDepot: reparation.dateDepot,
                        date_fin_reparation: result.value.date_fin_reparation
                    };

                    console.log("Données envoyées au backend :", maintenanceData);

                    // Envoi des données au backend pour créer la maintenance
                    const response = await axios.post(
                        'http://localhost:5000/api/maintenance/history',
                        maintenanceData
                    );

                    // Suppression de la demande de maintenance après création de la maintenance
                    await axios.delete(`http://localhost:5000/api/${reparation._id}`);

                    // Mise à jour de la liste des réparations (suppression locale)
                    setReparations(prevReparations =>
                        prevReparations.filter(rep => rep._id !== reparation._id)
                    );

                    toast.success("La maintenance a été finalisée et ajoutée à l'historique. ");
                } catch (error) {
                    console.error("Erreur détaillée:", error);
                    toast.error('Erreur: ' + (error.response?.data?.message || 'Une erreur est survenue lors de la sauvegarde.'));
                }
            }
        });
    }
};

  
  
  

  // Filtrage des réparations
  const filteredReparations = reparations
    .filter(reparation => {
      // Filtrage par état : si 'enAttente', on filtre uniquement les réparations en attente
      return filter === 'En attente' ? reparation.etat === 'En attente' : true;
    })
    .filter(reparation => {
      // Filtrage par mécanicien sélectionné
      return filter === '' || reparation.mecanicien?.nom.toLowerCase() === filter.toLowerCase();
    })
    .filter(reparation => {
      // Filtrage par terme de recherche dans le nom du chauffeur, véhicule ou ID
      return (
        reparation.chauffeur?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reparation.vehicule?.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reparation._id?.toString().includes(searchTerm)
      );
    })
    .filter(reparation => {
      // Exclure les réparations dont l'état est 'Terminé'
      return reparation.etat !== 'Terminé';
    })
    .filter(reparation => {
      // Filtrage par date si une date est sélectionnée
      return filterDate ? new Date(reparation.dateDepot).toDateString() === new Date(filterDate).toDateString() : true;
    });

  const csvData = filteredReparations.map(reparation => ({
    ID: reparation._id,
    Chauffeur: reparation.chauffeur.nom,
    Symptomes: reparation.symptomes_panne,
    mecanicien: reparation.mecanicien?.nom ,
    "Date Depot": reparation.dateDepot,
    "Date Prevue Remise": reparation.date_prevue_remise
  }));

  const totalPages = Math.ceil(filteredReparations.length / partsPerPage);
  const indexOfLastPart = currentPage * partsPerPage;
  const indexOfFirstPart = indexOfLastPart - partsPerPage;
  const currentParts = filteredReparations.slice(indexOfFirstPart, indexOfLastPart);

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

  const handleMouseLeave = () => {
    setActionMenuVisible({});
  };

  const handleExportConfirmation = () => {
    Swal.fire({
      title: "Confirmer l'exportation",
      text: "Êtes-vous sûr de vouloir exporter les données en CSV ?",
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

  return (
    
    <div className="w-full p-8 bg-white shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Véhicules en maintenance</h2>
          <p className="text-sm text-gray-500">Voir les informations sur toutes les maintenances à finaliser</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleExportConfirmation} className="bg-gray-950 text-white py-2 px-4 rounded-lg">
            Exporter CSV
          </button>
          <CSVLink
            id="csv-export-link"
            data={csvData}
            filename="maintenances_en_cours.csv"
            className="hidden"
          />
        </div>
      </div>

      <div className="border-b border-gray-200"></div>
      <div className="flex items-center space-x-4 py-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)} // Mettre à jour le filtre avec le mécanicien choisi
          className="py-2 px-4 border border-gray-300 rounded-lg text-gray-800"
        >
          <option value="">Sélectionner un mécanicien</option>
          {reparations
  .map(reparation => reparation.mecanicien?.nom) // Ajouter le "?" ici
  .filter((value, index, self) => self.indexOf(value) === index) // Supprimer les doublons
  .map((mecanicien, index) => (
    <option key={index} value={mecanicien}>
      {mecanicien}
    </option>
  ))
}

        </select>

        <input
          type="text"
          placeholder="Rechercher par nom de Véhicule..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="py-2 px-4 border border-gray-300 rounded-lg"
        />

        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="py-2 px-4 border border-gray-300 rounded-lg"
        />
      </div>

      <table className="min-w-full border-collapse bg-white shadow sm:rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr className="text-sm text-gray-500">
            <th className="px-6 py-3 text-left font-semibold border-b">ID</th>
            <th className="px-6 py-3 text-left font-semibold border-b">Chauffeur</th>
            <th className="px-6 py-3 text-left font-semibold border-b">Véhicule</th>
            <th className="px-6 py-3 text-left font-semibold border-b">Mécanicien</th>
            <th className="px-6 py-3 text-left font-semibold border-b">Symptomes Panne</th>
            <th className="px-6 py-3 text-left font-semibold border-b">Date Depot</th>
            <th className="px-8 py-3 text-left font-semibold border-b">État</th>
            <th className="px-6 py-3 text-left font-semibold border-b">Date Prévue Remise</th>
            <th className="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" className="text-center py-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-gray-600 text-lg">Chargement des maintenances...</p>
                </div>
              </td>
            </tr>
          ) : currentParts.length > 0 ? (
            currentParts.map((reparation) => (
              <tr key={reparation._id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">{reparation._id}</td>
                <td className="px-6 py-4">{reparation.chauffeur?.nom}</td>
                <td className="px-6 py-4">{reparation.vehicule?.immatriculation}</td>
                <td className="px-6 py-4">{reparation.mecanicien?.nom}</td>
                <td className="px-6 py-4">{reparation.symptomes_panne}</td>
                <td className="px-6 py-4">{new Date(reparation.dateDepot).toLocaleDateString()}</td>
               <td className="px-6 py-4">
  <span
    className={`inline py-1 px-3 font-semibold rounded-full text-md ${
      reparation.etat === "En attente" ? "text-yellow-500" : "text-green-500"
    }`}
  >
    {reparation.etat}
  </span>
</td>

                <td className="px-6 py-4">{new Date(reparation.date_prevue_remise).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-center">
                  <div className="relative">
                    <button
                      onClick={() => toggleActionMenu(reparation._id)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <FontAwesomeIcon icon={faEllipsisH} />
                    </button>
                    {actionMenuVisible[reparation._id] && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border"
                        onMouseLeave={handleMouseLeave}
                      >
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => handleAction(reparation, 'terminer')}
                        >
Finaliser la maintenance                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center py-6">Aucune réparation à afficher</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between items-center">
        <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg">Précédent</button>
        <span>{currentPage} / {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg">Suivant</button>
      </div>
    </div>
  );
};

export default ViewAllAppareil;
