import { FaProjectDiagram, FaCheckCircle,FaTasks } from 'react-icons/fa'; 
import { useState , useEffect } from 'react';
import DemandePieceTable from '../../pages/Technicien/DemandePieceTable';
import ViewAllProducts from '../../pages/Technicien/Tables View/ViewAllProducts';
import ViewHistorique from '../../pages/Technicien/Tables View/ViewHistroquie';
import axios from 'axios';


export default function DashboardContentTech() {
  const [statistiques, setStatistiques] =  useState({
    reparationsEnattente: 0,
    reparationsTerminees: 0,
    totalPiecesDemandées: 0,
  });

  useEffect(() => {
    const fetchStatistiques = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/statistiques');

        setStatistiques(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      }
    };

    fetchStatistiques();
  }, []);
  return (
    <div className="ml-64 pt-24 p-6 mt-6 space-y-6 bg-[#f4f7fe] dark:bg-gray-900 h-full">
        {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: "Total de réparations en attente", value: statistiques.reparationsEnattente , icon: <FaProjectDiagram size={21} color="#422afb" /> },
          { title: "Total de réparations terminées ce mois-ci", value: statistiques.reparationsTerminees , icon: <FaCheckCircle size={21} color="#422afb" /> },
          { title: "Total de piéces demandées", value: statistiques.totalPiecesDemandées , icon: <FaTasks size={21} color="#422afb" /> },
        ].map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f4f7fe] dark:bg-gray-700">
              {item.icon}
            </div>
            <div className="ml-4">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">{item.title}</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

        {/* Charts Section */}

       {/* Table Section  */}
       
   

      <div className="p-0 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <ViewAllProducts></ViewAllProducts>
      </div>

      <div className="p-0 rounded-lg shadow-md dark:bg-gray-800">
        <ViewHistorique></ViewHistorique>
      </div>

      <div className="p-0 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <DemandePieceTable></DemandePieceTable>
      </div>
      
    </div>
  );
}
