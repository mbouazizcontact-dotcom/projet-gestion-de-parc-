import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DefaultLayout from '../../../layouts/DefaultLayout';

const ReclamationsList = () => {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtreStatus, setFiltreStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [totalPages, setTotalPages] = useState(1);  // Initialisez le nombre total de pages à 1

  useEffect(() => {
    fetchReclamations();
  }, []);

  const fetchReclamations = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/reclamations?page=${page}&status=${status}`);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setReclamations(response.data.data);
        setTotalPages(response.data.totalPages);  // Mettez à jour le nombre total de pages
      } else {
        console.error('Format de données inattendu:', response.data);
        setReclamations([]);
      }
      
      setError(null);
    } catch (err) {
      setError('Erreur lors de la récupération des réclamations');
      console.error('Erreur:', err);
      setReclamations([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      setStatusUpdating(id); // Empêche les multiples appels pour le même élément
      const response = await axios.patch(`http://localhost:5000/api/reclamations/${id}/status`, { status: newStatus });
  
      if (response.data && response.data.success) {
        setReclamations(prevReclamations =>
          prevReclamations.map(rec =>
            rec._id === id ? { ...rec, status: newStatus } : rec
          )
        );
      } else {
        throw new Error('Échec de la mise à jour');
      }
    } catch (err) {
      alert('Erreur lors de la mise à jour du statut');
      console.error('Erreur de mise à jour:', err);
    } finally {
      setStatusUpdating(null); // Réinitialise l'état de mise à jour
    }
  };

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Filtrage des réclamations
  const reclamationsFiltrees = filtreStatus === 'all' 
    ? reclamations 
    : reclamations.filter(rec => rec.status === filtreStatus);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reclamationsFiltrees.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'resolved':
        return 'Résolu';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erreur!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <DefaultLayout>
      <div className='ml-64 pt-32 p-6  space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-screen'>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Liste des Réclamations</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filtrer par statut:</span>
            <select
              className="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtreStatus}
              onChange={(e) => {
                setFiltreStatus(e.target.value);
                setCurrentPage(1); // Réinitialiser à la première page lors du changement de filtre
              }}
            >
              <option value="all">Tous</option>
              <option value="pending">En attente</option>
              <option value="resolved">Résolu</option>
            </select>
          </div>
        </div>

        {reclamationsFiltrees.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucune réclamation trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sujet</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinataire</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((reclamation) => (
                    <tr key={reclamation._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{reclamation.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{reclamation.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-xs">{reclamation.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{reclamation.recipient}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(reclamation.status)}`}>
                            {getStatusLabel(reclamation.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(reclamation.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {reclamation.status !== 'resolved' && (
                       <button
                       type="button"
                       className={`text-sm font-medium rounded-lg px-5 py-2.5 text-center me-2 mb-2 border ${statusUpdating === reclamation._id ? "bg-green-800 text-white" : "text-green-700 border-green-700 hover:text-white hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300"}`}
                       onClick={() => updateStatus(reclamation._id, 'resolved')}
                       disabled={statusUpdating === reclamation._id}
                     >
                       {statusUpdating === reclamation._id ? (
                         <div className="spinner-border text-white" role="status">
                           <span className="sr-only">Chargement...</span>
                         </div>
                       ) : (
                         'Résoudre'
                       )}
                     </button>
                     
                       
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Précédent</span>
                    &laquo; Précédent
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Suivant</span>
                    Suivant &raquo;
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </DefaultLayout>
  );
};

export default ReclamationsList;
